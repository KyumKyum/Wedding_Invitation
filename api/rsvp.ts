import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put, list, del } from "@vercel/blob";

interface Guest {
  id: number;
  name: string;
  side: "bride" | "groom";
  timestamp: string;
}

interface RSVPData {
  guests: Guest[];
}

const BLOB_PREFIX = "rsvp-data";

async function getData(): Promise<RSVPData> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });

    if (blobs.length === 0) {
      return { guests: [] };
    }

    // Sort by uploadedAt descending to get the latest
    const sortedBlobs = blobs.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    const latestBlob = sortedBlobs[0];
    const response = await fetch(latestBlob.url);

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
  // First, get existing blobs to clean up old ones
  const { blobs } = await list({ prefix: BLOB_PREFIX });

  // Save new data
  await put(`${BLOB_PREFIX}.json`, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json",
  });

  // Delete old blobs to avoid accumulation
  for (const blob of blobs) {
    try {
      await del(blob.url);
    } catch (e) {
      console.error("Error deleting old blob:", e);
    }
  }
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
