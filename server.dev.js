import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Load password from .env file or use default for dev
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "20250809";

app.use(cors());
app.use(express.json());

// Data file paths
const DATA_DIR = path.join(__dirname, "data");
const RSVP_FILE = path.join(DATA_DIR, "rsvp-data.json");
const GUESTBOOK_FILE = path.join(DATA_DIR, "guestbook-data.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
if (!fs.existsSync(RSVP_FILE)) {
  fs.writeFileSync(RSVP_FILE, JSON.stringify({ guests: [] }, null, 2));
}

if (!fs.existsSync(GUESTBOOK_FILE)) {
  fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify({ messages: [] }, null, 2));
}

// Helper functions
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Middleware to check admin password
function verifyAdmin(req, res, next) {
  const password = req.headers["x-admin-password"];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ==================== ADMIN ENDPOINTS ====================

// POST /api/admin/verify - Verify admin password
app.post("/api/admin/verify", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.status(200).json({ success: true });
  }
  return res.status(401).json({ error: "Invalid password" });
});

// ==================== RSVP ENDPOINTS ====================

// GET /api/rsvp - Get all RSVPs
app.get("/api/rsvp", (req, res) => {
  try {
    const data = readJSON(RSVP_FILE) || { guests: [] };
    res.json(data);
  } catch (error) {
    console.error("Error reading RSVP data:", error);
    res.status(500).json({ error: "Failed to read RSVP data" });
  }
});

// POST /api/rsvp - Add new RSVP
app.post("/api/rsvp", (req, res) => {
  try {
    const { name, side, timestamp } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!side || !["bride", "groom"].includes(side)) {
      return res.status(400).json({ error: "Valid side (bride/groom) is required" });
    }

    const data = readJSON(RSVP_FILE) || { guests: [] };

    const newGuest = {
      id: Date.now(),
      name: name.trim(),
      side: side,
      timestamp: timestamp || new Date().toISOString(),
    };

    data.guests.push(newGuest);
    writeJSON(RSVP_FILE, data);

    console.log(`✓ New RSVP: ${name} (${side}'s side)`);
    res.status(201).json({ success: true, guest: newGuest });
  } catch (error) {
    console.error("Error saving RSVP:", error);
    res.status(500).json({ error: "Failed to save RSVP" });
  }
});

// DELETE /api/rsvp/:id - Delete RSVP (admin only)
app.delete("/api/rsvp/:id", verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const data = readJSON(RSVP_FILE) || { guests: [] };

    const guestIndex = data.guests.findIndex((g) => g.id === parseInt(id));

    if (guestIndex === -1) {
      return res.status(404).json({ error: "Guest not found" });
    }

    const removedGuest = data.guests.splice(guestIndex, 1)[0];
    writeJSON(RSVP_FILE, data);

    console.log(`✓ Deleted RSVP: ${removedGuest.name}`);
    res.json({ success: true, removed: removedGuest });
  } catch (error) {
    console.error("Error deleting RSVP:", error);
    res.status(500).json({ error: "Failed to delete RSVP" });
  }
});

// ==================== GUESTBOOK ENDPOINTS ====================

// GET /api/guestbook - Get all messages
app.get("/api/guestbook", (req, res) => {
  try {
    const data = readJSON(GUESTBOOK_FILE) || { messages: [] };
    res.json(data);
  } catch (error) {
    console.error("Error reading guestbook data:", error);
    res.status(500).json({ error: "Failed to read guestbook data" });
  }
});

// POST /api/guestbook - Add new message
app.post("/api/guestbook", (req, res) => {
  try {
    const { nickname, message, timestamp } = req.body;

    if (!nickname || !nickname.trim()) {
      return res.status(400).json({ error: "Nickname is required" });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (message.length > 200) {
      return res.status(400).json({ error: "Message must be 200 characters or less" });
    }

    const data = readJSON(GUESTBOOK_FILE) || { messages: [] };

    const newMessage = {
      id: Date.now(),
      nickname: nickname.trim(),
      message: message.trim(),
      timestamp: timestamp || new Date().toISOString(),
    };

    data.messages.push(newMessage);
    writeJSON(GUESTBOOK_FILE, data);

    console.log(`✓ New guestbook message from: ${nickname}`);
    res.status(201).json({ success: true, entry: newMessage });
  } catch (error) {
    console.error("Error saving guestbook message:", error);
    res.status(500).json({ error: "Failed to save guestbook message" });
  }
});

// DELETE /api/guestbook/:id - Delete message (admin only)
app.delete("/api/guestbook/:id", verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const data = readJSON(GUESTBOOK_FILE) || { messages: [] };

    const messageIndex = data.messages.findIndex((m) => m.id === parseInt(id));

    if (messageIndex === -1) {
      return res.status(404).json({ error: "Message not found" });
    }

    const removedMessage = data.messages.splice(messageIndex, 1)[0];
    writeJSON(GUESTBOOK_FILE, data);

    console.log(`✓ Deleted guestbook message from: ${removedMessage.nickname}`);
    res.json({ success: true, removed: removedMessage });
  } catch (error) {
    console.error("Error deleting guestbook message:", error);
    res.status(500).json({ error: "Failed to delete guestbook message" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log("");
  console.log("  🎊 Wedding Invitation Dev Server");
  console.log(`  ➜  API:   http://localhost:${PORT}`);
  console.log(`  ➜  Admin: Password is "${ADMIN_PASSWORD}"`);
  console.log("");
});
