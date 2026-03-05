import type { VercelRequest, VercelResponse } from "@vercel/node";

interface Guest {
  id: number;
  name: string;
  side: "bride" | "groom";
  timestamp: string;
}

interface RSVPData {
  guests: Guest[];
}

const BLOB_STORE_URL = process.env.BLOB_STORE_URL || "";
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";
const BLOB_FILE_NAME = "rsvp-data.json";

async function getData(): Promise<RSVPData> {
  try {
    // Try to fetch existing data
    const url = `${BLOB_STORE_URL}/${BLOB_FILE_NAME}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return data as RSVPData;
    }

    return { guests: [] };
  } catch (error) {
    console.error("Error reading RSVP data:", error);
    return { guests: [] };
  }
}

async function saveData(data: RSVPData): Promise<void> {
  const response = await fetch(
    `https://blob.vercel-storage.com/${BLOB_FILE_NAME}`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${BLOB_READ_WRITE_TOKEN}`,
        "Content-Type": "application/json",
        "x-api-version": "7",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Blob save error:", errorText);
    throw new Error(`Failed to save data: ${response.status}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Check for required environment variables
  if (!BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // GET - Retrieve all RSVPs
    if (req.method === "GET") {
      const data = await getData();
      return res.status(200).json(data);
    }

    // POST - Add new RSVP
    if (req.method === "POST") {
      const { name, side, timestamp } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Name is required" });
      }

      if (!side || !["bride", "groom"].includes(side)) {
        return res.status(400).json({ error: "Valid side (bride/groom) is required" });
      }

      const data = await getData();

      const newGuest: Guest = {
        id: Date.now(),
        name: name.trim(),
        side: side,
        timestamp: timestamp || new Date().toISOString(),
      };

      data.guests.push(newGuest);
      await saveData(data);

      console.log(`New RSVP: ${name} (${side}'s side)`);
      return res.status(201).json({ success: true, guest: newGuest });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("RSVP API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
