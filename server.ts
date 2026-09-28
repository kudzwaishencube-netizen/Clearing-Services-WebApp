import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const db = new Database("inventory.db");

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    type TEXT NOT NULL,
    price INTEGER NOT NULL,
    image TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed initial data once only if never seeded before
const metaRow = db.prepare("SELECT value FROM app_meta WHERE key = 'initial_seed_done'").get();
if (!metaRow) {
  const insert = db.prepare("INSERT INTO vehicles (make, model, year, type, price, image) VALUES (?, ?, ?, ?, ?, ?)");
  insert.run('Toyota', 'Hilux Revo', 2021, 'Truck', 35000, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800');
  insert.run('Mercedes-Benz', 'C-Class', 2019, 'Sedan', 28000, 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800');
  insert.run('Honda', 'CR-V', 2020, 'SUV', 22000, 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&q=80&w=800');
  db.prepare("INSERT INTO app_meta (key, value) VALUES ('initial_seed_done', 'true')").run();
}

// Ensure previously requested removals (IDs 4, 5, 6) remain cleared
try {
  db.prepare("DELETE FROM vehicles WHERE id IN (4, 5, 6)").run();
} catch (e) {
  // Ignore if already deleted
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Serve uploaded files and public assets
  app.use("/uploads", express.static(uploadsDir));
  app.use(express.static(path.join(__dirname, "public")));

  // API Routes
  app.get("/api/vehicles", (req, res) => {
    const vehicles = db.prepare("SELECT * FROM vehicles ORDER BY id DESC").all();
    res.json(vehicles);
  });

  app.post("/api/vehicles", (req, res) => {
    const { make, model, year, type, price, image } = req.body;
    if (!make || !model || !year || !type || !price || !image) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const info = db.prepare("INSERT INTO vehicles (make, model, year, type, price, image) VALUES (?, ?, ?, ?, ?, ?)")
      .run(make, model, year, type, price, image);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

  // Delete vehicle (DELETE method)
  app.delete("/api/vehicles/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    
    try {
      const result = db.prepare("DELETE FROM vehicles WHERE id = ?").run(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Fallback delete route using POST (some environments block DELETE)
  app.post("/api/vehicles/:id/delete", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    
    try {
      const result = db.prepare("DELETE FROM vehicles WHERE id = ?").run(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
