
'use server';

/**
 * @fileOverview This file defines a Genkit flow for solving user problems like a chatbot.
 *
 * - solveProblem - A function that takes conversation history and returns an AI response.
 * - SolveProblemInput - The input type for the solveProblem function.
 * - SolveProblemOutput - The return type for the solveProblemOutput function.
 */

import {ai} from '@/ai/genkit';
import {generate} from 'genkit';
import {z} from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const SolveProblemInputSchema = z.object({
  history: z.array(MessageSchema).describe("The conversation history."),
  prompt: z.string().describe('The latest user prompt.'),
});
export type SolveProblemInput = z.infer<typeof SolveProblemInputSchema>;

const SolveProblemOutputSchema = z.object({
  response: z.string().describe('The AI-generated response.'),
});
export type SolveProblemOutput = z.infer<typeof SolveProblemOutputSchema>;

export async function solveProblem(
  input: SolveProblemInput
): Promise<SolveProblemOutput> {
  return solveProblemFlow(input);
}


const solveProblemFlow = ai.defineFlow(
  {
    name: 'solveProblemFlow',
    inputSchema: SolveProblemInputSchema,
    outputSchema: SolveProblemOutputSchema,
  },
  async ({ history, prompt }) => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const llmResponse = await generate({
        model: 'googleai/gemini-pro',
        history: history.map(h => ({ role: h.role, content: [{ text: h.content }] })),
        prompt: `You are a friendly and helpful AI problem solver. Your goal is to assist users with their questions and problems as accurately and concisely as possible.
  
        New user prompt: ${prompt}`,
    });

    const responseText = llmResponse.text;

    return {
        response: responseText,
    }
  }
);

