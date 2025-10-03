
'use server';

/**
 * @fileOverview A Genkit flow for solving user-described problems using a Google AI model.
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
      model: 'gemini-1.5-flash',
      prompt: `You are a friendly and helpful chatbot acting as an expert problem solver. A user is asking for help.
Your goal is to provide a simple, conversational, and easy-to-understand solution, like ChatGPT. 
First, detect the user's language and respond in that same language.
Avoid overly technical jargon. Keep your answers concise, straight to the point, and formatted clearly with steps or bullet points if applicable.

Here is the user's problem: "${problem}"`,
    });

    return llmResponse.text;
  }
);
