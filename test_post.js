import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const GAS_URL = process.env.VITE_GAS_URL || "https://script.google.com/macros/s/AKfycbzZvhbhrOZpfHeJNHmZLdOZ_pLacnhKPBbaN7QYERnt0OZwI0iZNSdLtNyFwaIVlv05_A/exec";
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ action: "syncSalesData", data: [{date: "2023-10-01", location: "Toko Jakarta", sku: "ITM001", qty: 999}] }),
    });
    const text = await res.text();
    console.log("Response from GAS POST:", text.substring(0, 500));
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
