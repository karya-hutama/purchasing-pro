import express from "express";
import { createServer as createViteServer } from "vite";
import apiApp from "./api/index.js";

const app = express();
const PORT = 3000;

// Mount the API routes
app.use(apiApp);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
