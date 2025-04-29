// api/recordingrules.js
import { createExpressHandler } from './createExpressHandler';
import recordingRulesFunction from '@twilio-labs/plugin-rtc/src/serverless/functions/recordingrules';
export default createExpressHandler(recordingRulesFunction.handler);
