import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put, list } from "@vercel/blob";

interface Guest {
  id: number;
  name: string;
  side: "bride" | "groom";
  timestamp: string;
}

interface RSVPData {
  guests: Guest[];
}

const BLOB_PATH = "rsvp-data.json";

async function getData(): Promise<RSVPData> {
  try {
    const { blobs } = await list({ prefix: "rsvp-data" });

    if (blobs.length === 0) {
      return { guests: [] };
    }

    const response = await fetch(blobs[0].url);

    if (!response.ok) {
      return { guests: [] };
    }

    const data = await response.json();
    return data as RSVPData;
  } catch (error) {
    console.error("Error reading RSVP data:", error);
    return { guests: [] };
  }
}

async function saveData(data: RSVPData): Promise<void> {
  await put(BLOB_PATH, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "GET") {
      const data = await getData();
      return res.status(200).json(data);
    }

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

      return res.status(201).json({ success: true, guest: newGuest });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("RSVP API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
