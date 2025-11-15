import withCors from "./_cors.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    // Manually read JSON body
    let body = "";
    await new Promise(resolve => {
      req.on("data", chunk => (body += chunk));
      req.on("end", resolve);
    });

    const { message } = JSON.parse(body || "{}");

    if (!message) {
      return res.status(400).json({ ok: false, error: "Message is required" });
    }

    // Call OpenAI
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: message }
        ]
      }),
    });

    const data = await aiRes.json();
    const reply = data?.choices?.[0]?.message?.content || "No response from OpenAI";

    return res.status(200).json({ ok: true, reply });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
}

// IMPORTANT: Wrap handler with CORS
export default withCors(handler);

