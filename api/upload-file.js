import withCors from './_cors.js';

export const config = {
  api: {
    bodyParser: false
  }
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  res.status(200).json({
    ok: true,
    message: 'File upload endpoint works (dummy)'
  });
}

export default withCors(handler);
