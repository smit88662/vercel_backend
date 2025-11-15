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

/*
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pollRunStatus(threadId, runId, apiKey, attempt = 0) {
  const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`Run status error: ${errorPayload}`);
  }

  const run = await response.json();

  if (run.status === "completed") {
    return run;
  }

  if (["failed", "cancelled", "expired"].includes(run.status)) {
    throw new Error(`Run ${run.status}`);
  }

  if (attempt > 30) {
    throw new Error("Run polling timeout");
  }

  await sleep(1000);
  return pollRunStatus(threadId, runId, apiKey, attempt + 1);
}

function extractAssistantReply(messages) {
  for (const message of messages.data) {
    if (message.role === "assistant") {
      const parts = message.content
        ?.filter(part => part.type === "text" && part.text?.value)
        .map(part => part.text.value.trim()) || [];
      const text = parts.join("\n").trim();
      if (text) {
        return text;
      }
    }
  }
  return "AI generated response here";
}
*/

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  /*
  const assistantId = process.env.OPENAI_ASSISTANT_ID;
  */

  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "OPENAI_API_KEY is not configured" });
  }

  /*
  if (!assistantId) {
    return res.status(500).json({ ok: false, error: "OPENAI_ASSISTANT_ID is not configured" });
  }
  */

  let rawBody;
  try {
    rawBody = await readRequestBody(req);
  } catch (error) {
    return res.status(400).json({ ok: false, error: "Invalid request body", details: error.message });
  }

  let threadId;
  let message;
  try {
    ({ threadId, message } = JSON.parse(rawBody || "{}"));
  } catch (error) {
    return res.status(400).json({ ok: false, error: "Body must be valid JSON", details: error.message });
  }

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ ok: false, error: "Message is required" });
  }

  if (typeof threadId !== "string" || !threadId.trim()) {
    return res.status(400).json({ ok: false, error: "Thread ID required" });
  }

  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
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
      return res.status(completion.status).json({ ok: false, error: "OpenAI chat completion failed", details: errorPayload });
    }

    const json = await completion.json();
    const reply = json.choices?.[0]?.message?.content || "No response";

    return res.status(200).json({
      ok: true,
      reply,
    });

    /*
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        role: "user",
        content: message,
      }),
    });

    if (!messageResponse.ok) {
      const errorPayload = await messageResponse.text();
      return res.status(messageResponse.status).json({ ok: false, error: "Failed to append message", details: errorPayload });
    }

    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        model: "gpt-4o-mini",
      }),
    });

    if (!runResponse.ok) {
      const errorPayload = await runResponse.text();
      return res.status(runResponse.status).json({ ok: false, error: "Failed to start run", details: errorPayload });
    }

    const runData = await runResponse.json();
    const runId = runData?.id;

    if (!runId) {
      return res.status(500).json({ ok: false, error: "Run ID missing" });
    }

    await pollRunStatus(threadId, runId, apiKey);

    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "GET",
       headers: {
        "Authorization": `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      }
    });

    if (!messagesResponse.ok) {
      const errorPayload = await messagesResponse.text();
      return res.status(messagesResponse.status).json({ ok: false, error: "Failed to fetch messages", details: errorPayload });
    }

    const messages = await messagesResponse.json();
    const reply = extractAssistantReply(messages);

    return res.status(200).json({ ok: true, reply });
    */
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Chat completion failed", details: error.message });
  }
}

export default withCors(handler);

