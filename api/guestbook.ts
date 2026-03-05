import type { VercelRequest, VercelResponse } from "@vercel/node";

interface GuestbookMessage {
  id: number;
  nickname: string;
  message: string;
  timestamp: string;
}

interface GuestbookData {
  messages: GuestbookMessage[];
}

const BLOB_STORE_URL = process.env.BLOB_STORE_URL || "";
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";
const BLOB_FILE_NAME = "guestbook-data.json";

async function getData(): Promise<GuestbookData> {
  try {
    const url = `${BLOB_STORE_URL}/${BLOB_FILE_NAME}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return data as GuestbookData;
    }

    return { messages: [] };
  } catch (error) {
    console.error("Error reading guestbook data:", error);
    return { messages: [] };
  }
}

async function saveData(data: GuestbookData): Promise<void> {
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
  // Set CORS headers
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
    // GET - Retrieve all messages
    if (req.method === "GET") {
      const data = await getData();
      return res.status(200).json(data);
    }

    // POST - Add new message
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

      console.log(`New guestbook message from: ${nickname}`);
      return res.status(201).json({ success: true, entry: newMessage });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Guestbook API error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
