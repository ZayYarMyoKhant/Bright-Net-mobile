import {genkit} from 'genkit';
import {mistral} from '@genkit-ai/mistral';

export const ai = genkit({
  plugins: [mistral({apiKey: process.env.MISTRAL_API_KEY})],
});
