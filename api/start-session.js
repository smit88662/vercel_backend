import withCors from "./_cors.js";

const sessions = globalThis.__OPENAI_THREAD_SESSIONS__
  ? globalThis.__OPENAI_THREAD_SESSIONS__
  : (globalThis.__OPENAI_THREAD_SESSIONS__ = {});

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "OPENAI_API_KEY is not configured" });
  }

  let rawBody;
  try {
    rawBody = await readRequestBody(req);
  } catch (error) {
    return res.status(400).json({ ok: false, error: "Invalid request body", details: error.message });
  }

  let mobile;
  try {
    ({ mobile } = JSON.parse(rawBody || "{}"));
  } catch (error) {
    return res.status(400).json({ ok: false, error: "Body must be valid JSON", details: error.message });
  }

  if (typeof mobile !== "string" || !mobile.trim()) {
    return res.status(400).json({ ok: false, error: "Mobile number is required" });
  }

  const normalizedMobile = mobile.trim();
  if (sessions[normalizedMobile]) {
    return res.status(200).json({
      ok: true,
      threadId: sessions[normalizedMobile],
      message: "Existing session",
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      return res.status(response.status).json({ ok: false, error: "Failed to create thread", details: errorPayload });
    }

    const data = await response.json();
    const threadId = data?.id;

    if (!threadId) {
      return res.status(500).json({ ok: false, error: "OpenAI thread ID missing" });
    }

    sessions[normalizedMobile] = threadId;

    return res.status(200).json({
      ok: true,
      threadId,
      message: "Session started",
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Failed to create thread", details: error.message });
  }
}

export default withCors(handler);
