// api/token.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';  // Vercel types :contentReference[oaicite:3]{index=3}
import { AccessToken } from 'twilio';

// these must be set in Vercel Environment Variables
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY_SID,
  TWILIO_API_KEY_SECRET
} = process.env;

// sanity‐check at startup
if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
  throw new Error('Twilio credentials are not all set in environment');
}

// VideoGrant lives as a static on AccessToken in TS as well
const VideoGrant = AccessToken.VideoGrant;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { identity, room } = req.body as { identity?: string; room?: string };

  if (!identity || !room) {
    res.status(400).json({ error: 'Both identity and room are required' });
    return;
  }

  try {
    // Create the Access Token object
    const token = new AccessToken(
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY_SID,
      TWILIO_API_KEY_SECRET,
      { ttl: 3600 }                // one‐hour TTL
    );

    token.identity = identity;

    // Grant access to Video for the given room
    const grant = new VideoGrant({ room });
    token.addGrant(grant);

    // Respond with the JWT string
    res.status(200).json({ token: token.toJwt() });
  } catch (err) {
    console.error('Token generation error:', err);
    res.status(500).json({ error: 'Could not generate token' });
  }
}
