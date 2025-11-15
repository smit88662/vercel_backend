import withCors from "./_cors.js";

export const config = {
  api: {
    bodyParser: false, // we manually parse the body
  },
};

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/* -------------------------------
   THREADS API CODE (Commented Out)
----------------------------------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ... all your previous Threads API code ...
*/

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const apiKey = process.env.VERCEL_AI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "OPENAI_API_KEY is not configured" });
  }

  // Read raw request body
  let rawBody;
  try {
    rawBody = await readRequestBody(req);
  } catch (error) {
    return res.status(400).json({ ok: false, error: "Invalid request body", details: error.message });
  }

  // Extract threadId + message (NO more mobile!)
  let threadId;
  let message;

  try {
    ({ threadId, message } = JSON.parse(rawBody || "{}"));
  } catch (error) {
    return res.status(400).json({ ok: false, error: "Body must be valid JSON", details: error.message });
  }

  // Validate message
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ ok: false, error: "Message is required" });
  }

  // Validate threadId
  if (typeof threadId !== "string" || !threadId.trim()) {
    return res.status(400).json({ ok: false, error: "Thread ID required" });
  }

  // -------------------------------
  //  USE CHAT COMPLETIONS API
  // -------------------------------
  try {
    const completion = await fetch("https://api.ai.vercel.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: message },
        ],
      }),
    });

    if (!completion.ok) {
      const errorPayload = await completion.text();
      return res.status(completion.status).json({
        ok: false,
        error: "OpenAI chat completion failed",
        details: errorPayload,
      });
    }

    const json = await completion.json();
    const reply = json.choices?.[0]?.message?.content || "No response";

    return res.status(200).json({
      ok: true,
      reply,
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Chat completion failed",
      details: error.message,
    });
  }
}

export default withCors(handler);

