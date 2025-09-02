
'use server';

/**
 * @fileOverview This file defines a Genkit flow for translating text between languages.
 *
 * - translateText - A function that translates text to a target language.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.string().describe('The language to translate the text into (e.g., "Myanmar", "English", "Spanish").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    return translateTextFlow(input);
}


const translateTextPrompt = ai.definePrompt({
    name: 'translateTextPrompt',
    input: { schema: TranslateTextInputSchema },
    output: { schema: z.string() },
    prompt: `Translate the following text to {{{targetLanguage}}}. Do not add any extra explanations or introductory text, just provide the raw translated text.\n\nText to translate: "{{{text}}}"`,
    model: 'googleai/gemini-1.5-flash-latest'
})

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    
    const llmResponse = await translateTextPrompt(input);
    const translatedText = llmResponse.output || "";

    return {
        translatedText,
    };
  }
);
