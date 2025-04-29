// api/recordingrules.ts
import { Request, Response } from 'express';
import Twilio from 'twilio';
import type { ServerlessContext, ServerlessResponse } from './types';

const tokenRecordingFunction = require(
  '@twilio-labs/plugin-rtc/src/serverless/functions/recordingrules'
).handler;

export default function handler(req: Request, res: Response): void {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    TWILIO_CONVERSATIONS_SERVICE_SID,
    REACT_APP_TWILIO_ENVIRONMENT,
  } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
    res
      .status(500)
      .json({ error: 'Twilio credentials are not set in the environment.' });
    return;
  }

  // Create the Twilio client.
  const twilioClient = Twilio(
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    {
      accountSid: TWILIO_ACCOUNT_SID,
      region: REACT_APP_TWILIO_ENVIRONMENT === 'prod' ? undefined : REACT_APP_TWILIO_ENVIRONMENT,
    }
  );

  // Build the context.
  const context: ServerlessContext = {
    ACCOUNT_SID: TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID: TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET: TWILIO_API_KEY_SECRET,
    ROOM_TYPE: 'group',
    CONVERSATIONS_SERVICE_SID: TWILIO_CONVERSATIONS_SERVICE_SID,
    getTwilioClient: () => twilioClient,
  };

  const params = req.body;

  tokenRecordingFunction(context, params, (_: unknown, serverlessResponse: ServerlessResponse) => {
    const { statusCode, headers, body } = serverlessResponse;
    if (headers) {
      Object.keys(headers).forEach((key) => res.setHeader(key, headers[key]));
    }
    res.status(statusCode).json(body);
  });
}