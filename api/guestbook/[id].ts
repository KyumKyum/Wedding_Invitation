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

const BLOB_NAME = "guestbook-data.json";

async function getData(): Promise<GuestbookData> {
  try {
    const { blobs } = await list({ prefix: BLOB_NAME });
    if (blobs.length === 0) {
      return { messages: [] };
    }
    const response = await fetch(blobs[0].url);
    const data = await response.json();
    return data as GuestbookData;
  } catch (error) {
    console.error("Error reading guestbook data:", error);
    return { messages: [] };
  }
}

async function saveData(data: GuestbookData): Promise<void> {
  await put(BLOB_NAME, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
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
    const messageIndex = data.messages.findIndex((m) => m.id === parseInt(id as string));

    if (messageIndex === -1) {
      return res.status(404).json({ error: "Message not found" });
    }

    const removedMessage = data.messages.splice(messageIndex, 1)[0];
    await saveData(data);

    console.log(`Deleted guestbook message from: ${removedMessage.nickname}`);
    return res.status(200).json({ success: true, removed: removedMessage });
  } catch (error) {
    console.error("Guestbook delete error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
