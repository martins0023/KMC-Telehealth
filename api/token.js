// api/token.js
import { createExpressHandler } from './createExpressHandler';
import tokenFunction from '@twilio-labs/plugin-rtc/src/serverless/functions/token';
export default createExpressHandler(tokenFunction.handler);
