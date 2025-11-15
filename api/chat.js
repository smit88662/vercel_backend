import withCors from "./_cors.js";

export const config = {
  api: {
    bodyParser: false,
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

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  let rawBody;
  try {
    rawBody = await readRequestBody(req);
  } catch (error) {
    return res.status(400).json({ ok: false, error: "Invalid request body", details: error.message });
  }

  let message;
  try {
    ({ message } = JSON.parse(rawBody || "{}"));
  } catch (error) {
    return res.status(400).json({ ok: false, error: "Body must be valid JSON", details: error.message });
  }

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ ok: false, error: "Message is required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "OPENAI_API_KEY is not configured" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      return res.status(response.status).json({ ok: false, error: "OpenAI API error", details: errorPayload });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "AI generated response here";

    return res.status(200).json({ ok: true, reply });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Failed to reach OpenAI", details: error.message });
  }
}

export default withCors(handler);

