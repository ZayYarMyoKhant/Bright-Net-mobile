
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

const problemSolverFlow = ai.defineFlow(
  {
    name: 'problemSolverFlow',
    inputSchema: ProblemInputSchema,
    outputSchema: ProblemOutputSchema,
  },
  async (problem) => {
    
    const model = ai.model('googleai/gemini-pro');

    const llmResponse = await model.generate({
      prompt: `You are an expert problem solver. A user is asking for help with the following problem. Provide a clear, step-by-step solution. Format the solution with headings and bullet points for readability.

Problem: "${problem}"`,
    });

    return llmResponse.text;
  }
);

export const solveProblem = problemSolverFlow;
