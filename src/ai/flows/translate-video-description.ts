'use server';

/**
 * @fileOverview This file defines a Genkit flow for translating video descriptions from Myanmar to English.
 *
 * - translateVideoDescription - A function that translates the video description.
 * - TranslateVideoDescriptionInput - The input type for the translateVideoDescription function.
 * - TranslateVideoDescriptionOutput - The return type for the translateVideoDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateVideoDescriptionInputSchema = z.object({
  descriptionMyanmar: z
    .string()
    .describe('The video description in Myanmar language.'),
});
export type TranslateVideoDescriptionInput = z.infer<
  typeof TranslateVideoDescriptionInputSchema
>;

const TranslateVideoDescriptionOutputSchema = z.object({
  descriptionEnglish: z
    .string()
    .describe('The translated video description in English.'),
});
export type TranslateVideoDescriptionOutput = z.infer<
  typeof TranslateVideoDescriptionOutputSchema
>;

export async function translateVideoDescription(
  input: TranslateVideoDescriptionInput
): Promise<TranslateVideoDescriptionOutput> {
  return translateVideoDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateVideoDescriptionPrompt',
  input: {schema: TranslateVideoDescriptionInputSchema},
  output: {schema: TranslateVideoDescriptionOutputSchema},
  prompt: `Translate the following Myanmar video description to English:\n\n{{descriptionMyanmar}}`,
});

const translateVideoDescriptionFlow = ai.defineFlow(
  {
    name: 'translateVideoDescriptionFlow',
    inputSchema: TranslateVideoDescriptionInputSchema,
    outputSchema: TranslateVideoDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
