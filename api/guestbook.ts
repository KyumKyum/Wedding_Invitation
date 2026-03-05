import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put, list } from "@vercel/blob";

interface GuestbookMessage {
  id: number;
  nickname: string;
  message: string;
  timestamp: string;
}

interface GuestbookData {
  messages: GuestbookMessage[];
}

const BLOB_PATH = "guestbook-data.json";

async function getData(): Promise<GuestbookData> {
  try {
    const { blobs } = await list({ prefix: "guestbook-data" });

    if (blobs.length === 0) {
      return { messages: [] };
    }

    const response = await fetch(blobs[0].url);

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
