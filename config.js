module.exports = {
    // BSC RPC Endpoints - gunakan yang tercepat untuk area Anda
    BSC_RPC_URLS: [
        'https://bsc-dataseed1.binance.org/',
        'https://bsc-dataseed2.binance.org/',
        'https://bsc-dataseed3.binance.org/',
        'https://bsc-dataseed4.binance.org/',
        'https://bsc-dataseed1.defibit.io/',
        'https://bsc-dataseed2.defibit.io/',
        'https://bsc-dataseed3.defibit.io/',
        'https://bsc-dataseed4.defibit.io/',
        'https://bsc-dataseed1.ninicoin.io/',
        'https://bsc-dataseed2.ninicoin.io/',
        'https://bsc-dataseed3.ninicoin.io/',
        'https://bsc-dataseed4.ninicoin.io/'
    ],
    
    // Chain ID untuk BSC Mainnet
    CHAIN_ID: 56,
    
    // Delay antar request dalam milliseconds (untuk menghindari rate limiting)
    REQUEST_DELAY: 100,
    
    // Jumlah retry jika request gagal
    MAX_RETRIES: 3,
    
    // Timeout untuk setiap request dalam milliseconds
    REQUEST_TIMEOUT: 10000,
    
    // File input untuk daftar wallet addresses
    WALLET_FILE: 'wallets.txt',
    
    // Output file untuk hasil (opsional)
    OUTPUT_FILE: 'balance_results.json',
    
    // Output file TXT untuk wallet dengan balance > 1 BNB
    HIGH_BALANCE_TXT_FILE: 'high_balance_wallets.txt',
    
    // Minimum balance untuk masuk ke file TXT (dalam BNB)
    MIN_BALANCE_FOR_TXT: 1.0
};
