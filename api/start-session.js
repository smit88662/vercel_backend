import withCors from "./_cors.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  return res.status(200).json({
    ok: true,
    threadId: `thread-${Date.now()}`,
    message: "Session started",
  });
}

export default withCors(handler);
