// server/types.ts
export interface ServerlessContext {
  ACCOUNT_SID: string;
  TWILIO_API_KEY_SID: string;
  TWILIO_API_KEY_SECRET: string;
  ROOM_TYPE: string;
  CONVERSATIONS_SERVICE_SID?: string;
  getTwilioClient: () => any;
}

export interface ServerlessResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: any;
}

export type ServerlessFunction = (
  context: ServerlessContext,
  params: any,
  callback: (error: unknown, response: ServerlessResponse) => void
) => void;