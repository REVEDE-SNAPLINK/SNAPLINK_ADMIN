import type { VercelRequest, VercelResponse } from '@vercel/node';

const LINK_HUB_BASE = process.env.LINK_HUB_API_BASE_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.LINK_HUB_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'LINK_HUB_API_KEY is not configured' });
    return;
  }

  const query = new URLSearchParams(req.query as Record<string, string>).toString();
  const upstreamUrl = `${LINK_HUB_BASE}/api/presets${query ? `?${query}` : ''}`;

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
