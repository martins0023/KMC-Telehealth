// api/token.ts
import { Request, Response } from 'express';
import Twilio from 'twilio';
import type {
  ServerlessContext,
  ServerlessResponse,
  ServerlessFunction,
} from './types';

// Import the token-generation function from the Twilio RTC plugin.
const tokenFunction: ServerlessFunction = require('@twilio-labs/plugin-rtc/src/serverless/functions/token')
  .handler;

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

  // Create a Twilio client instance.
  const twilioClient = Twilio(
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    {
      accountSid: TWILIO_ACCOUNT_SID,
      // Use the environment to determine the region.
      region: REACT_APP_TWILIO_ENVIRONMENT === 'prod' ? undefined : REACT_APP_TWILIO_ENVIRONMENT,
    }
  );

  // Build the context expected by the token function.
  const context: ServerlessContext = {
    ACCOUNT_SID: TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID: TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET: TWILIO_API_KEY_SECRET,
    ROOM_TYPE: 'group',
    CONVERSATIONS_SERVICE_SID: TWILIO_CONVERSATIONS_SERVICE_SID,
    getTwilioClient: () => twilioClient,
  };

  // The body of the POST request should include { user_identity, room_name }.
  const params = req.body;

  // Invoke the token function and map the callback result to the HTTP response.
  tokenFunction(context, params, (_: unknown, serverlessResponse: ServerlessResponse) => {
    const { statusCode, headers, body } = serverlessResponse;
    if (headers) {
      Object.keys(headers).forEach((key) => res.setHeader(key, headers[key]));
    }
    res.status(statusCode).json(body);
  });
}