// api/token.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AccessToken } from 'twilio';

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY_SID,
  TWILIO_API_KEY_SECRET
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
  console.error('Missing Twilio credentials in env');
  // Always return JSON, even on startup errors
  throw new Error('Twilio credentials not configured');
}

const VideoGrant = AccessToken.VideoGrant;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { identity, room } = req.body as { identity?: string; room?: string };
  if (!identity || !room) {
    return res.status(400).json({ error: 'identity and room are required' });
  }

  try {
    const token = new AccessToken(
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY_SID,
      TWILIO_API_KEY_SECRET,
      { ttl: 3600 }
    );
    token.identity = identity;
    token.addGrant(new VideoGrant({ room }));
    return res.status(200).json({ token: token.toJwt() });
  } catch (err: any) {
    console.error('Token generation error:', err);
    // Always return JSON on errors
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
