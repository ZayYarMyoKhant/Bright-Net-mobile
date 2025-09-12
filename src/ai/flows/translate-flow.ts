
'use server';

/**
 * @fileOverview A Genkit flow for translating text between languages.
 *
 * - translateText - A function that handles the text translation.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  sourceLang: z.string().describe('The source language of the text (e.g., "English").'),
  targetLang: z.string().describe('The target language for the translation (e.g., "Burmese").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.string().describe("The translated text.");
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;


export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  model: 'gemini-1.5-flash-preview',
  input: { schema: TranslateTextInputSchema },
  output: { schema: TranslateTextOutputSchema },
  prompt: `Translate the following text from {{sourceLang}} to {{targetLang}}. Provide only the translated text, with no extra explanation or introductory phrases.\n\nText to translate: "{{text}}"`,
});


const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
  },
  async (input) => {
    
    const llmResponse = await prompt(input);

    return llmResponse;
  }
);
