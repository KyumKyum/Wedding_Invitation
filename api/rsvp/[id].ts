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
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-password");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const providedPassword = req.headers["x-admin-password"];

    if (!adminPassword || providedPassword !== adminPassword) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    const data = await getData();
    const guestIndex = data.guests.findIndex((g) => g.id === parseInt(id as string));

    if (guestIndex === -1) {
      return res.status(404).json({ error: "Guest not found" });
    }

    const removedGuest = data.guests.splice(guestIndex, 1)[0];
    await saveData(data);

    return res.status(200).json({ success: true, removed: removedGuest });
  } catch (error) {
    console.error("RSVP Delete Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
