const { ethers } = require('ethers');
const fs = require('fs');
const chalk = require('chalk');
const Table = require('cli-table3');
const config = require('./config');

class BSCBalanceChecker {
    constructor() {
        this.provider = null;
        this.currentRpcIndex = 0;
        this.retryCount = 0;
        this.results = [];
    }

    // Inisialisasi provider dengan RPC endpoint
    async initProvider() {
        const rpcUrl = config.BSC_RPC_URLS[this.currentRpcIndex];
        console.log(chalk.blue(`🔌 Menghubungkan ke BSC RPC: ${rpcUrl}`));
        
        this.provider = new ethers.JsonRpcProvider(rpcUrl, {
            chainId: config.CHAIN_ID,
            name: 'bsc'
        });

        try {
            // Test koneksi
            const network = await this.provider.getNetwork();
            console.log(chalk.green(`✅ Terhubung ke BSC Mainnet (Chain ID: ${network.chainId})`));
            return true;
        } catch (error) {
            console.log(chalk.red(`❌ Gagal terhubung ke RPC: ${error.message}`));
            return false;
        }
    }

    // Switch ke RPC endpoint berikutnya jika ada masalah
    async switchRpcEndpoint() {
        this.currentRpcIndex = (this.currentRpcIndex + 1) % config.BSC_RPC_URLS.length;
        return await this.initProvider();
    }

    // Membaca daftar wallet dari file
    readWalletAddresses() {
        try {
            if (!fs.existsSync(config.WALLET_FILE)) {
                console.log(chalk.red(`❌ File ${config.WALLET_FILE} tidak ditemukan!`));
                console.log(chalk.yellow(`💡 Silakan buat file ${config.WALLET_FILE} dan masukkan daftar wallet address (satu per baris)`));
                process.exit(1);
            }

            const content = fs.readFileSync(config.WALLET_FILE, 'utf8');
            const addresses = content
                .split('\n')
                .map(addr => addr.trim())
                .filter(addr => addr.length > 0 && addr.startsWith('0x'));

            console.log(chalk.blue(`📋 Ditemukan ${addresses.length} wallet address untuk dicek`));
            return addresses;
        } catch (error) {
            console.log(chalk.red(`❌ Error membaca file wallet: ${error.message}`));
            process.exit(1);
        }
    }

    // Mengecek balance BNB untuk satu wallet
    async checkBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            const balanceInBNB = ethers.formatEther(balance);
            return {
                address: address,
                balance: balanceInBNB,
                balanceWei: balance.toString(),
                status: 'success'
            };
        } catch (error) {
            return {
                address: address,
                balance: '0',
                balanceWei: '0',
                status: 'error',
                error: error.message
            };
        }
    }

    // Delay untuk menghindari rate limiting
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Mengecek balance semua wallet
    async checkAllBalances() {
        const addresses = this.readWalletAddresses();
        
        if (addresses.length === 0) {
            console.log(chalk.red('❌ Tidak ada wallet address valid yang ditemukan!'));
            return;
        }

        console.log(chalk.blue(`🚀 Memulai pengecekan balance untuk ${addresses.length} wallet...\n`));

        const startTime = Date.now();
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < addresses.length; i++) {
            const address = addresses[i];
            
            // Tampilkan progress
            const progress = `[${i + 1}/${addresses.length}]`;
            console.log(chalk.gray(`${progress} Mengecek: ${address}`));

            let result = null;
            let attempts = 0;

            // Retry logic
            while (attempts < config.MAX_RETRIES && !result) {
                try {
                    result = await this.checkBalance(address);
                    if (result.status === 'success') {
                        successCount++;
                        const balanceFormatted = parseFloat(result.balance).toFixed(6);
                        console.log(chalk.green(`${progress} ✅ ${address}: ${balanceFormatted} BNB`));
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    attempts++;
                    if (attempts < config.MAX_RETRIES) {
                        console.log(chalk.yellow(`${progress} ⚠️  Retry ${attempts}/${config.MAX_RETRIES}...`));
                        await this.delay(config.REQUEST_DELAY * 2);
                        
                        // Switch RPC jika perlu
                        if (attempts === 2) {
                            console.log(chalk.yellow(`${progress} 🔄 Mencoba RPC endpoint lain...`));
                            await this.switchRpcEndpoint();
                        }
                    } else {
                        result = {
                            address: address,
                            balance: '0',
                            balanceWei: '0',
                            status: 'error',
                            error: error.message
                        };
                        errorCount++;
                        console.log(chalk.red(`${progress} ❌ ${address}: Error - ${error.message}`));
                    }
                }
            }

            this.results.push(result);

            // Delay antar request
            if (i < addresses.length - 1) {
                await this.delay(config.REQUEST_DELAY);
            }
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(chalk.blue(`\n🏁 Selesai! Waktu: ${duration} detik`));
        console.log(chalk.green(`✅ Berhasil: ${successCount}`));
        console.log(chalk.red(`❌ Error: ${errorCount}`));

        this.displayResults();
        this.saveResults();
        this.saveHighBalanceToTXT();
        this.saveLowBalanceToTXT();
    }

    // Menampilkan hasil dalam bentuk tabel
    displayResults() {
        console.log(chalk.blue('\n📊 HASIL PENGECEKAN BALANCE:\n'));

        const table = new Table({
            head: ['No', 'Wallet Address', 'Balance (BNB)', 'Status'],
            colWidths: [5, 45, 20, 15]
        });

        this.results.forEach((result, index) => {
            const no = (index + 1).toString();
            const address = result.address;
            const balance = result.status === 'success' 
                ? parseFloat(result.balance).toFixed(6) 
                : '0.000000';
            const status = result.status;

            table.push([
                no,
                address,
                balance,
                status === 'success' ? chalk.green('✅ OK') : chalk.red('❌ Error')
            ]);
        });

        console.log(table.toString());

        // Statistik
        const totalBalance = this.results
            .filter(r => r.status === 'success')
            .reduce((sum, r) => sum + parseFloat(r.balance), 0);

        // Filter wallet dengan balance tinggi dan rendah
        const highBalanceWallets = this.results
            .filter(r => r.status === 'success' && parseFloat(r.balance) >= config.MIN_BALANCE_FOR_TXT);
        
        const lowBalanceWallets = this.results
            .filter(r => r.status === 'success' && parseFloat(r.balance) < config.MAX_BALANCE_FOR_LOW_TXT && parseFloat(r.balance) > 0);

        console.log(chalk.blue(`\n📈 STATISTIK:`));
        console.log(chalk.white(`Total Wallet: ${this.results.length}`));
        console.log(chalk.green(`Total Balance: ${totalBalance.toFixed(6)} BNB`));
        console.log(chalk.magenta(`Wallet dengan Balance ≥ ${config.MIN_BALANCE_FOR_TXT} BNB: ${highBalanceWallets.length}`));
        console.log(chalk.cyan(`Wallet dengan Balance < ${config.MAX_BALANCE_FOR_LOW_TXT} BNB: ${lowBalanceWallets.length}`));
        console.log(chalk.yellow(`Nilai USD (estimasi): $${(totalBalance * 600).toFixed(2)} *`)); // Asumsi BNB = $600
        console.log(chalk.gray(`* Harga BNB diasumsikan $600 untuk estimasi`));
    }

    // Menyimpan hasil ke file JSON
    saveResults() {
        try {
            const output = {
                timestamp: new Date().toISOString(),
                total_wallets: this.results.length,
                successful_checks: this.results.filter(r => r.status === 'success').length,
                failed_checks: this.results.filter(r => r.status === 'error').length,
                total_balance_bnb: this.results
                    .filter(r => r.status === 'success')
                    .reduce((sum, r) => sum + parseFloat(r.balance), 0),
                results: this.results
            };

            fs.writeFileSync(config.OUTPUT_FILE, JSON.stringify(output, null, 2));
            console.log(chalk.green(`💾 Hasil disimpan ke: ${config.OUTPUT_FILE}`));
        } catch (error) {
            console.log(chalk.red(`❌ Error menyimpan file: ${error.message}`));
        }
    }

    // Menyimpan wallet dengan balance tinggi ke file TXT
    saveHighBalanceToTXT() {
        try {
            // Filter wallet dengan balance >= minimum
            const highBalanceWallets = this.results
                .filter(r => r.status === 'success' && parseFloat(r.balance) >= config.MIN_BALANCE_FOR_TXT)
                .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance)); // Sort descending by balance

            if (highBalanceWallets.length === 0) {
                console.log(chalk.yellow(`⚠️  Tidak ada wallet dengan balance ≥ ${config.MIN_BALANCE_FOR_TXT} BNB`));
                return;
            }

            // Buat header untuk file TXT
            const timestamp = new Date().toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            let txtContent = `BSC WALLET BALANCE CHECKER - HIGH BALANCE RESULTS\n`;
            txtContent += `=================================================\n`;
            txtContent += `Timestamp: ${timestamp}\n`;
            txtContent += `Minimum Balance Filter: ${config.MIN_BALANCE_FOR_TXT} BNB\n`;
            txtContent += `Total High Balance Wallets: ${highBalanceWallets.length}\n`;
            txtContent += `=================================================\n\n`;

            // Hitung total balance untuk wallet high balance
            const totalHighBalance = highBalanceWallets.reduce((sum, r) => sum + parseFloat(r.balance), 0);
            txtContent += `SUMMARY:\n`;
            txtContent += `- Total Wallets Checked: ${this.results.length}\n`;
            txtContent += `- High Balance Wallets (≥${config.MIN_BALANCE_FOR_TXT} BNB): ${highBalanceWallets.length}\n`;
            txtContent += `- Total High Balance: ${totalHighBalance.toFixed(6)} BNB\n`;
            txtContent += `- Estimated USD Value: $${(totalHighBalance * 600).toFixed(2)}\n\n`;

            // Daftar wallet dengan format yang rapi
            txtContent += `HIGH BALANCE WALLETS LIST:\n`;
            txtContent += `=========================\n\n`;

            highBalanceWallets.forEach((result, index) => {
                const no = (index + 1).toString().padStart(3, ' ');
                const balance = parseFloat(result.balance).toFixed(6).padStart(12, ' ');
                const usdValue = (parseFloat(result.balance) * 600).toFixed(2).padStart(10, ' ');
                
                txtContent += `${no}. Address: ${result.address}\n`;
                txtContent += `     Balance: ${balance} BNB (~$${usdValue} USD)\n\n`;
            });

            // Tambahkan raw list untuk copy-paste
            txtContent += `\nRAW WALLET ADDRESSES (for copy-paste):\n`;
            txtContent += `=====================================\n`;
            highBalanceWallets.forEach(result => {
                txtContent += `${result.address}\n`;
            });

            txtContent += `\n=================================================\n`;
            txtContent += `Generated by BSC Balance Checker Bot\n`;
            txtContent += `Note: USD values are estimated based on $600/BNB\n`;
            txtContent += `=================================================`;

            // Simpan ke file
            fs.writeFileSync(config.HIGH_BALANCE_TXT_FILE, txtContent, 'utf8');
            
            console.log(chalk.green(`💰 High balance wallets (≥${config.MIN_BALANCE_FOR_TXT} BNB) disimpan ke: ${config.HIGH_BALANCE_TXT_FILE}`));
            console.log(chalk.cyan(`📊 ${highBalanceWallets.length} wallet dengan total ${totalHighBalance.toFixed(6)} BNB`));

        } catch (error) {
            console.log(chalk.red(`❌ Error menyimpan file TXT: ${error.message}`));
        }
    }

    // Menyimpan wallet dengan balance rendah ke file TXT
    saveLowBalanceToTXT() {
        try {
            // Filter wallet dengan balance < maximum dan > 0
            const lowBalanceWallets = this.results
                .filter(r => r.status === 'success' && parseFloat(r.balance) < config.MAX_BALANCE_FOR_LOW_TXT && parseFloat(r.balance) > 0)
                .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance)); // Sort descending by balance

            if (lowBalanceWallets.length === 0) {
                console.log(chalk.yellow(`⚠️  Tidak ada wallet dengan balance < ${config.MAX_BALANCE_FOR_LOW_TXT} BNB (dan > 0)`));
                return;
            }

            // Buat header untuk file TXT
            const timestamp = new Date().toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            let txtContent = `BSC WALLET BALANCE CHECKER - LOW BALANCE RESULTS\n`;
            txtContent += `=================================================\n`;
            txtContent += `Timestamp: ${timestamp}\n`;
            txtContent += `Maximum Balance Filter: < ${config.MAX_BALANCE_FOR_LOW_TXT} BNB\n`;
            txtContent += `Total Low Balance Wallets: ${lowBalanceWallets.length}\n`;
            txtContent += `=================================================\n\n`;

            // Hitung total balance untuk wallet low balance
            const totalLowBalance = lowBalanceWallets.reduce((sum, r) => sum + parseFloat(r.balance), 0);
            txtContent += `SUMMARY:\n`;
            txtContent += `- Total Wallets Checked: ${this.results.length}\n`;
            txtContent += `- Low Balance Wallets (<${config.MAX_BALANCE_FOR_LOW_TXT} BNB): ${lowBalanceWallets.length}\n`;
            txtContent += `- Total Low Balance: ${totalLowBalance.toFixed(6)} BNB\n`;
            txtContent += `- Estimated USD Value: $${(totalLowBalance * 600).toFixed(2)}\n\n`;

            // Daftar wallet dengan format yang rapi
            txtContent += `LOW BALANCE WALLETS LIST:\n`;
            txtContent += `=========================\n\n`;

            lowBalanceWallets.forEach((result, index) => {
                const no = (index + 1).toString().padStart(3, ' ');
                const balance = parseFloat(result.balance).toFixed(6).padStart(12, ' ');
                const usdValue = (parseFloat(result.balance) * 600).toFixed(2).padStart(10, ' ');
                
                txtContent += `${no}. Address: ${result.address}\n`;
                txtContent += `     Balance: ${balance} BNB (~$${usdValue} USD)\n\n`;
            });

            // Tambahkan raw list untuk copy-paste
            txtContent += `\nRAW WALLET ADDRESSES (for copy-paste):\n`;
            txtContent += `=====================================\n`;
            lowBalanceWallets.forEach(result => {
                txtContent += `${result.address}\n`;
            });

            txtContent += `\n=================================================\n`;
            txtContent += `Generated by BSC Balance Checker Bot\n`;
            txtContent += `Note: USD values are estimated based on $600/BNB\n`;
            txtContent += `=================================================`;

            // Simpan ke file
            fs.writeFileSync(config.LOW_BALANCE_TXT_FILE, txtContent, 'utf8');
            
            console.log(chalk.green(`📉 Low balance wallets (<${config.MAX_BALANCE_FOR_LOW_TXT} BNB) disimpan ke: ${config.LOW_BALANCE_TXT_FILE}`));
            console.log(chalk.cyan(`📊 ${lowBalanceWallets.length} wallet dengan total ${totalLowBalance.toFixed(6)} BNB`));

        } catch (error) {
            console.log(chalk.red(`❌ Error menyimpan file TXT low balance: ${error.message}`));
        }
    }
}

// Menjalankan bot
async function main() {
    console.log(chalk.bold.blue('\n🤖 BSC BALANCE CHECKER BOT\n'));
    console.log(chalk.gray('Bot untuk mengecek balance masal wallet BSC'));
    console.log(chalk.gray('='.repeat(50)));

    const bot = new BSCBalanceChecker();
    
    // Inisialisasi provider
    const connected = await bot.initProvider();
    if (!connected) {
        console.log(chalk.red('❌ Tidak bisa terhubung ke BSC network!'));
        process.exit(1);
    }

    // Mulai pengecekan
    await bot.checkAllBalances();
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.log(chalk.red(`❌ Unhandled error: ${error.message}`));
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Bot dihentikan oleh user'));
    process.exit(0);
});

// Jalankan main function
if (require.main === module) {
    main().catch(error => {
        console.log(chalk.red(`❌ Fatal error: ${error.message}`));
        process.exit(1);
    });
}

module.exports = BSCBalanceChecker;
