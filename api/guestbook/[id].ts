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

    if (!BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set");
      return res.status(500).json({ error: "Server configuration error" });
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
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
