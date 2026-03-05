import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put, list, del } from "@vercel/blob";

interface GuestbookMessage {
  id: number;
  nickname: string;
  message: string;
  timestamp: string;
}

interface GuestbookData {
  messages: GuestbookMessage[];
}

const BLOB_PREFIX = "guestbook-data";

async function getData(): Promise<GuestbookData> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });

    if (blobs.length === 0) {
      return { messages: [] };
    }

    // Sort by uploadedAt descending to get the latest
    const sortedBlobs = blobs.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    const latestBlob = sortedBlobs[0];
    const response = await fetch(latestBlob.url);

    if (!response.ok) {
      return { messages: [] };
    }

    const data = await response.json();
    return data as GuestbookData;
  } catch (error) {
    console.error("Error reading guestbook data:", error);
    return { messages: [] };
  }
}

async function saveData(data: GuestbookData): Promise<void> {
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

      const data = await getData();

      const newMessage: GuestbookMessage = {
        id: Date.now(),
        nickname: nickname.trim(),
        message: message.trim(),
        timestamp: timestamp || new Date().toISOString(),
      };

      data.messages.push(newMessage);
      await saveData(data);

      return res.status(201).json({ success: true, entry: newMessage });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Guestbook API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
