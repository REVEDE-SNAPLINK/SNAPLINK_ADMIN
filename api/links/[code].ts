import type { VercelRequest, VercelResponse } from '@vercel/node';

const LINK_HUB_BASE = process.env.LINK_HUB_API_BASE_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!LINK_HUB_BASE) {
    res.status(500).json({ error: 'LINK_HUB_API_BASE_URL is not configured' });
    return;
  }

  const apiKey = process.env.LINK_HUB_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'LINK_HUB_API_KEY is not configured' });
    return;
  }

  const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
  if (!code) {
    res.status(400).json({ error: 'Missing code' });
    return;
  }

  const restQuery = Object.fromEntries(Object.entries(req.query).filter(([k]) => k !== 'code'));
  const query = new URLSearchParams(restQuery as Record<string, string>).toString();
  const upstreamUrl = `${LINK_HUB_BASE}/api/links/${code}${query ? `?${query}` : ''}`;

  const upstream = await fetch(upstreamUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  });

  const data = await upstream.json();
  res.status(upstream.status).json(data);
}
