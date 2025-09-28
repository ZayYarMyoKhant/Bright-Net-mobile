
'use server';

/**
 * @fileOverview A Genkit flow for generating random text for the typing battle game.
 *
 * - typingTextFlow - A function that returns a short, interesting paragraph.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TypingTextOutputSchema = z.string().describe("A short paragraph of about 40-50 words for a typing test.");
export type TypingTextOutput = z.infer<typeof TypingTextOutputSchema>;


export async function getTypingText(): Promise<TypingTextOutput> {
    return typingTextFlow();
}

const typingTextFlow = ai.defineFlow(
  {
    name: 'typingTextFlow',
    outputSchema: TypingTextOutputSchema,
  },
  async () => {
    
    const llmResponse = await ai.generate({
      model: 'gemini-1.0-pro',
      prompt: `Generate a single, interesting, and easy-to-type paragraph of about 40 to 50 words. The paragraph should be suitable for a typing speed test. Do not include any introductory phrases, just the paragraph itself.`,
    });

    // Clean up the text: remove quotes and extra whitespace.
    return llmResponse.text.replace(/"/g, '').trim();
  }
);
