# 🤖 BSC Balance Checker Bot

Bot untuk mengecek balance masal wallet BSC (Binance Smart Chain) menggunakan JavaScript.

## ✨ Fitur

- ✅ **Cek Balance Masal**: Cek balance BNB untuk ratusan wallet sekaligus
- 🔄 **Multi RPC Endpoint**: Otomatis switch ke RPC lain jika ada masalah
- ⚡ **Fast & Efficient**: Optimized dengan retry logic dan rate limiting
- 📊 **Beautiful Output**: Hasil ditampilkan dalam tabel yang rapi dengan warna
- 💾 **Export Results**: Simpan hasil ke file JSON untuk analisis lebih lanjut
- 💰 **High Balance Filter**: Otomatis buat file TXT untuk wallet dengan balance ≥ 1 BNB
- 🛡️ **Error Handling**: Robust error handling dengan retry mechanism
- 📈 **Statistics**: Tampilkan statistik total balance dan estimasi nilai USD

## 🚀 Instalasi

1. **Clone atau download project ini**
2. **Install Node.js** (versi 14+ recommended)
3. **Install dependencies:**
   ```bash
   npm install
   ```

## 📝 Cara Penggunaan

### 1. Persiapkan Daftar Wallet

Edit file `wallets.txt` dan masukkan daftar wallet address (satu per baris):

```
0x8894E0a0c962CB723c1976a4421c95949bE2D4E3
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed
...
```

### 2. Jalankan Bot

```bash
npm start
```

atau

```bash
node bot.js
```

### 3. Lihat Hasil

Bot akan menampilkan progress real-time dan hasil akhir dalam bentuk tabel:

```
🤖 BSC BALANCE CHECKER BOT

🔌 Menghubungkan ke BSC RPC: https://bsc-dataseed1.binance.org/
✅ Terhubung ke BSC Mainnet (Chain ID: 56)
📋 Ditemukan 10 wallet address untuk dicek

🚀 Memulai pengecekan balance untuk 10 wallet...

[1/10] Mengecek: 0x8894E0a0c962CB723c1976a4421c95949bE2D4E3
[1/10] ✅ 0x8894E0a0c962CB723c1976a4421c95949bE2D4E3: 2.450000 BNB

...

📊 HASIL PENGECEKAN BALANCE:

┌─────┬───────────────────────────────────────────────┬────────────────────┬───────────────┐
│ No  │ Wallet Address                                │ Balance (BNB)      │ Status        │
├─────┼───────────────────────────────────────────────┼────────────────────┼───────────────┤
│ 1   │ 0x8894E0a0c962CB723c1976a4421c95949bE2D4E3    │ 2.450000           │ ✅ OK         │
│ 2   │ 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045    │ 0.000000           │ ✅ OK         │
└─────┴───────────────────────────────────────────────┴────────────────────┴───────────────┘

📈 STATISTIK:
Total Wallet: 10
Total Balance: 15.750000 BNB
Wallet dengan Balance ≥ 1.0 BNB: 3
Nilai USD (estimasi): $9,450.00 *
* Harga BNB diasumsikan $600 untuk estimasi

💾 Hasil disimpan ke: balance_results.json
💰 High balance wallets (≥1.0 BNB) disimpan ke: high_balance_wallets.txt
📊 3 wallet dengan total 12.500000 BNB
```

## ⚙️ Konfigurasi

Edit file `config.js` untuk menyesuaikan pengaturan:

```javascript
module.exports = {
    // Delay antar request (ms)
    REQUEST_DELAY: 100,
    
    // Jumlah retry jika gagal
    MAX_RETRIES: 3,
    
    // Timeout per request (ms)
    REQUEST_TIMEOUT: 10000,
    
    // File input untuk wallet addresses
    WALLET_FILE: 'wallets.txt',
    
    // File output untuk hasil
    OUTPUT_FILE: 'balance_results.json',
    
    // File TXT untuk wallet balance tinggi
    HIGH_BALANCE_TXT_FILE: 'high_balance_wallets.txt',
    
    // Minimum balance untuk masuk file TXT (BNB)
    MIN_BALANCE_FOR_TXT: 1.0
};
```

## 📁 Struktur File

```
bsc/
├── bot.js                    # Script utama bot
├── config.js                 # File konfigurasi
├── wallets.txt               # Daftar wallet addresses
├── package.json              # Dependencies dan scripts
├── README.md                 # Dokumentasi ini
├── balance_results.json      # Hasil output JSON (auto-generated)
├── high_balance_wallets.txt  # Wallet balance tinggi TXT (auto-generated)
└── node_modules/             # Dependencies (setelah npm install)
```

## 🔧 Troubleshooting

### Bot tidak bisa connect ke BSC?
- Pastikan koneksi internet stabil
- Bot akan otomatis mencoba RPC endpoint lain jika ada masalah
- Coba jalankan ulang jika masih gagal

### Error "File wallets.txt tidak ditemukan"?
- Pastikan file `wallets.txt` ada di folder yang sama dengan `bot.js`
- File harus berisi wallet addresses (satu per baris)

### Balance tidak akurat?
- Bot mengambil data real-time dari BSC network
- Pastikan wallet address valid (format 0x...)
- Delay kecil mungkin terjadi karena sinkronisasi blockchain

### Rate limiting?
- Bot sudah dilengkapi delay otomatis
- Jika masih kena limit, tingkatkan `REQUEST_DELAY` di `config.js`
- Bot akan otomatis retry dengan delay lebih lama

## 🛡️ Security & Privacy

- ✅ Bot hanya **READ-ONLY** (hanya membaca balance)
- ✅ **Tidak memerlukan private key** wallet
- ✅ Data wallet hanya disimpan local
- ✅ Tidak ada data yang dikirim ke server eksternal (kecuali RPC BSC)

## 📊 Format Output

### 1. File JSON (`balance_results.json`)

File JSON berisi data lengkap semua wallet:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "total_wallets": 10,
  "successful_checks": 9,
  "failed_checks": 1,
  "total_balance_bnb": 15.750000,
  "results": [
    {
      "address": "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3",
      "balance": "2.450000",
      "balanceWei": "2450000000000000000",
      "status": "success"
    }
  ]
}
```

### 2. File TXT High Balance (`high_balance_wallets.txt`)

File TXT khusus untuk wallet dengan balance ≥ 1 BNB (bisa diatur di config):

```
BSC WALLET BALANCE CHECKER - HIGH BALANCE RESULTS
=================================================
Timestamp: 23/10/2025 14:30:45
Minimum Balance Filter: 1.0 BNB
Total High Balance Wallets: 3
=================================================

SUMMARY:
- Total Wallets Checked: 66
- High Balance Wallets (≥1.0 BNB): 3
- Total High Balance: 12.500000 BNB
- Estimated USD Value: $7,500.00

HIGH BALANCE WALLETS LIST:
=========================

  1. Address: 0x8894E0a0c962CB723c1976a4421c95949bE2D4E3
     Balance:     5.250000 BNB (~$  3150.00 USD)

  2. Address: 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed
     Balance:     4.125000 BNB (~$  2475.00 USD)

  3. Address: 0x4Bbd41d0B2EE76e05a4D74d5eb92F10e74c2EDB8
     Balance:     3.125000 BNB (~$  1875.00 USD)

RAW WALLET ADDRESSES (for copy-paste):
=====================================
0x8894E0a0c962CB723c1976a4421c95949bE2D4E3
0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed
0x4Bbd41d0B2EE76e05a4D74d5eb92F10e74c2EDB8

=================================================
Generated by BSC Balance Checker Bot
Note: USD values are estimated based on $600/BNB
=================================================
```

## 💡 Tips Penggunaan

1. **Untuk wallet banyak**: Bot bisa handle ratusan wallet, tapi sebaiknya batch 100-200 wallet per run
2. **High Balance Filter**: Sesuaikan `MIN_BALANCE_FOR_TXT` di config.js (default 1.0 BNB)
3. **Monitoring real-time**: Gunakan output JSON untuk membuat dashboard monitoring
4. **Target High Balance**: File TXT cocok untuk fokus pada wallet yang memiliki balance signifikan
5. **Analisis historis**: Simpan hasil dengan timestamp berbeda untuk tracking perubahan balance
6. **Integration**: File JSON bisa diimport ke Excel/Google Sheets untuk analisis lebih lanjut
7. **Copy-paste ready**: Bagian "RAW WALLET ADDRESSES" di file TXT siap untuk copy-paste

## 🤝 Support

Jika ada pertanyaan atau masalah:
- Cek bagian Troubleshooting di atas
- Review konfigurasi di `config.js`
- Pastikan wallet addresses dalam format yang benar

## 📜 License

MIT License - Feel free to modify and distribute!

---

**⚠️ Disclaimer**: Bot ini hanya untuk tujuan informasi. Selalu verifikasi data penting melalui blockchain explorer resmi.
