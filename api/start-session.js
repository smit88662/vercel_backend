import withCors from './_cors.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const timestamp = Date.now();

  res.status(200).json({
    ok: true,
    threadId: `test-thread-${timestamp}`,
    message: 'Session created successfully!'
  });
}

export default withCors(handler);
