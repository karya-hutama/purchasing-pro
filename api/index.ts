import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));

const GAS_URL = process.env.VITE_GAS_URL;

let cachedData: any = null;
let fetchPromise: Promise<void> | null = null;
let lastError: string | null = null;

// Fetch data from Google Sheets and cache it
const fetchFromGAS = async () => {
  if (!GAS_URL) return;
  
  if (fetchPromise) {
    return fetchPromise;
  }
  
  fetchPromise = (async () => {
    try {
      console.log("Fetching data from Google Sheets...");
      const response = await fetch(GAS_URL);
      if (response.ok) {
        const text = await response.text();
        try {
          cachedData = JSON.parse(text);
          lastError = null;
          console.log("Data successfully fetched and cached.");
        } catch (e) {
          lastError = "Gagal membaca data. Pastikan Google Apps Script di-deploy dengan akses 'Anyone' (Siapa saja).";
          console.error(lastError, e);
        }
      } else {
        lastError = `Failed to fetch from GAS: ${response.status} ${response.statusText}`;
        console.error(lastError);
      }
    } catch (error: any) {
      lastError = `Error fetching from GAS: ${error.message}`;
      console.error(lastError);
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
};

// Initial fetch on cold start
fetchFromGAS();

app.get(["/api/data", "/data"], async (req, res) => {
  if (!GAS_URL) {
    return res.json({ error: "URL Google Apps Script belum dikonfigurasi di Vercel Environment Variables (VITE_GAS_URL)." });
  }

  if (!cachedData) {
    // If cache is empty, wait for fetch
    await fetchFromGAS();
  }
  
  if (!cachedData) {
    return res.json({ error: lastError || "Gagal mengambil data dari Google Sheets. Pastikan URL sudah benar dan script sudah di-deploy dengan akses 'Anyone'." });
  }

  res.json(cachedData);
});

app.post(["/api/sync", "/sync"], async (req, res) => {
  const { action, data } = req.body;
  
  // Optimistically update cache
  if (cachedData) {
    if (action === 'syncLocations') {
      cachedData.locations = data;
    } else if (action === 'syncSuppliers') {
      cachedData.suppliers = data;
    } else if (action === 'syncItems') {
      cachedData.items = data;
    } else if (action === 'syncCompetitorList') {
      cachedData.competitorList = data;
    } else if (action === 'syncCompetitors') {
      cachedData.competitors = data;
    } else if (action === 'syncPurchases') {
      cachedData.purchases = data;
    } else if (action === 'syncSalesData') {
      cachedData.salesData = data;
    }
  }

  // Sync to GAS before responding so Vercel doesn't kill the function
  if (GAS_URL) {
    try {
      await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ action, data }),
      });
    } catch (error) {
      console.error(`Error syncing ${action} to GAS:`, error);
      return res.status(500).json({ error: "Failed to sync to Google Sheets" });
    }
  }

  res.json({ status: "ok" });
});

export default app;
