import withCors from './_cors.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  res.status(200).json({
    ok: true,
    reply: 'This is a test response from the Vercel backend!'
  });
}

export default withCors(handler);
