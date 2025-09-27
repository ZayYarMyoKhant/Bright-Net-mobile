
'use server';

/**
 * @fileOverview A Genkit flow for solving user-described problems.
 *
 * - solveProblem - A function that takes a problem description and returns a step-by-step solution.
 * - ProblemInput - The input type for the solveProblem function.
 * - ProblemOutput - The return type for the solveProblem function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProblemInputSchema = z.string().describe('The problem described by the user.');
export type ProblemInput = z.infer<typeof ProblemInputSchema>;

const ProblemOutputSchema = z.string().describe("The step-by-step solution to the problem.");
export type ProblemOutput = z.infer<typeof ProblemOutputSchema>;

export async function solveProblem(input: ProblemInput): Promise<ProblemOutput> {
    return problemSolverFlow(input);
}

const problemSolverFlow = ai.defineFlow(
  {
    name: 'problemSolverFlow',
    inputSchema: ProblemInputSchema,
    outputSchema: ProblemOutputSchema,
  },
  async (problem) => {
    
    const llmResponse = await ai.generate({
      model: 'gemini-pro',
      prompt: `You are a friendly and helpful chatbot. A user is asking for help with a problem. 
First, detect the language of the user's problem. Then, respond in that SAME language.
Your goal is to provide a simple, conversational, and easy-to-understand solution. Avoid overly technical jargon or long-winded explanations. 
Keep your answers concise and straight to the point, as if you were explaining it to a friend.

Problem: "${problem}"`,
    });

    return llmResponse.text;
  }
);
