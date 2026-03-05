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
