import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));

const GAS_URL = process.env.VITE_GAS_URL;

let cachedData: any = null;
let isFetching = false;

// Fetch data from Google Sheets and cache it
const fetchFromGAS = async () => {
  if (!GAS_URL) return;
  if (isFetching) return;
  
  isFetching = true;
  try {
    console.log("Fetching data from Google Sheets...");
    const response = await fetch(GAS_URL);
    if (response.ok) {
      cachedData = await response.json();
      console.log("Data successfully fetched and cached.");
    } else {
      console.error("Failed to fetch from GAS:", response.statusText);
    }
  } catch (error) {
    console.error("Error fetching from GAS:", error);
  } finally {
    isFetching = false;
  }
};

// Initial fetch on cold start
fetchFromGAS();

app.get("/api/data", async (req, res) => {
  if (!cachedData) {
    // If cache is empty, wait for fetch
    await fetchFromGAS();
  }
  res.json(cachedData || {});
});

app.post("/api/sync", async (req, res) => {
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

  res.json({ status: "ok" }); // Respond immediately to frontend

  // Sync to GAS in background
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
    }
  }
});

export default app;
