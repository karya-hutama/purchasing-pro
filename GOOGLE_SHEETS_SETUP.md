# Panduan Integrasi Google Sheets sebagai Database

Website ini telah disiapkan untuk menggunakan Google Sheets sebagai database. Ikuti langkah-langkah di bawah ini untuk menghubungkannya.

## Langkah 1: Buat Google Sheet Baru
1. Buka [Google Sheets](https://sheets.google.com) dan buat spreadsheet baru (misal: "Database Purchasing Pro").
2. Anda **tidak perlu** membuat sheet secara manual, script akan membuatnya otomatis saat pertama kali data disimpan.

## Langkah 2: Tambahkan Google Apps Script
1. Di menu Google Sheets, klik **Ekstensi** > **Apps Script**.
2. Hapus semua kode yang ada di `Code.gs`, lalu copy-paste kode di bawah ini:

```javascript
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = {
    locations: getSheetData(ss, 'Locations'),
    suppliers: getSheetData(ss, 'Suppliers'),
    items: getSheetData(ss, 'Items'),
    competitorList: getSheetData(ss, 'CompetitorList'),
    competitors: getSheetData(ss, 'Competitors'),
    purchases: getSheetData(ss, 'Purchases'),
    salesData: getSheetData(ss, 'SalesData')
  };
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'syncLocations') syncSheet(ss, 'Locations', data, ['Name']);
    else if (action === 'syncSuppliers') syncSheet(ss, 'Suppliers', data, ['id', 'name', 'phone', 'address', 'top']);
    else if (action === 'syncItems') syncSheet(ss, 'Items', data, ['sku', 'name', 'category', 'hpp', 'prices', 'suppliers']);
    else if (action === 'syncCompetitorList') syncSheet(ss, 'CompetitorList', data, ['id', 'name', 'nearLocation']);
    else if (action === 'syncCompetitors') syncSheet(ss, 'Competitors', data, ['id', 'competitorId', 'competitorName', 'nearLocation', 'productSku', 'grade', 'competitorPrice', 'ownPrice', 'hpp', 'pricingIndex']);
    else if (action === 'syncPurchases') syncSheet(ss, 'Purchases', data, ['id', 'date', 'location', 'sku', 'itemName', 'qty', 'value', 'pricePerQty', 'supplierId']);
    else if (action === 'syncSalesData') syncSheet(ss, 'SalesData', data, ['date', 'location', 'sku', 'qty']);
    
    return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function syncSheet(ss, sheetName, data, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  sheet.clear();
  
  if (data.length === 0) {
    sheet.appendRow(headers);
    return;
  }
  
  var rows = [headers];
  for (var i = 0; i < data.length; i++) {
    var row = [];
    for (var j = 0; j < headers.length; j++) {
      var val = data[i][headers[j]];
      if (typeof val === 'object') {
        row.push(JSON.stringify(val));
      } else {
        row.push(val);
      }
    }
    rows.push(row);
  }
  
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
}
```

## Langkah 3: Deploy Apps Script
1. Klik tombol **Terapkan (Deploy)** di pojok kanan atas > **Deployment baru (New deployment)**.
2. Pilih jenis: **Aplikasi Web (Web app)**.
3. Isi deskripsi (misal: "API v1").
4. Jalankan sebagai: **Saya (Me)**.
5. Yang memiliki akses: **Siapa saja (Anyone)**.
6. Klik **Terapkan (Deploy)**.
7. *Catatan: Anda mungkin diminta untuk memberikan otorisasi akses. Klik "Review permissions", pilih akun Google Anda, klik "Advanced", lalu "Go to Untitled project (unsafe)".*
8. Copy **URL Aplikasi Web (Web app URL)** yang dihasilkan.

## Langkah 4: Hubungkan ke Website
1. Di project website ini, buat file `.env` (atau edit `.env.example` menjadi `.env`).
2. Tambahkan URL yang Anda copy tadi ke dalam variabel `VITE_GAS_URL`:
   ```env
   VITE_GAS_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```
3. Restart server website. Sekarang semua data yang Anda tambah/edit/hapus di website akan otomatis tersimpan di Google Sheets!
