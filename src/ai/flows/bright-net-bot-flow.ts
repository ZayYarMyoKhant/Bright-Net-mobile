
'use server';

/**
 * @fileOverview The main AI bot for Bright-Net.
 *
 * - brightNetBot - The primary function that acts as a multi-purpose AI assistant.
 * - BrightNetBotInput - The input type for the bot.
 * - BrightNetBotOutput - The return type for the bot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BrightNetBotInputSchema = z.string().describe('The user\'s query to the Bright-Net AI bot.');
export type BrightNetBotInput = z.infer<typeof BrightNetBotInputSchema>;

const BrightNetBotOutputSchema = z.string().describe("The bot's response to the user's query.");
export type BrightNetBotOutput = z.infer<typeof BrightNetBotOutputSchema>;


export async function brightNetBot(input: BrightNetBotInput): Promise<BrightNetBotOutput> {
    return brightNetBotFlow(input);
}


const brightNetBotFlow = ai.defineFlow(
  {
    name: 'brightNetBotFlow',
    inputSchema: BrightNetBotInputSchema,
    outputSchema: BrightNetBotOutputSchema,
  },
  async (prompt) => {
    
    const llmResponse = await ai.generate({
      model: 'gemini-1.5-flash',
      prompt: `You are the core AI assistant for "Bright Net App".
Your primary responsibilities are:
1.  **Multilingual Communication**: Respond fluently and naturally in the language the user uses. First, detect the user's language, then provide the entire response in that same language.
2.  **Academic Problem Solver**: Accurately solve and explain complex problems in Mathematics (including calculus and algebra), Physics, and Chemistry. When providing a solution, use clear steps. Format equations professionally.
3.  **Creative & Informative Writer**: Generate comprehensive essays, detailed articles, and creative texts upon request.
4.  **Translator**: If the user asks for a translation, provide it. For example, if they say "translate 'hello' to Spanish", you should respond with "Hola".
5.  **Tool Guide**: If the user's query matches a tool, guide them.
    - If the user's query is about "Typing Battle" or a typing test, respond with: "You can start a typing battle by clicking the icon on the top right."
    - Do not suggest any other tools.
6.  **Tone**: Maintain a helpful, knowledgeable, and encouraging tone. Always prioritize factual accuracy. Avoid overly long pleasantries. Be direct and helpful.

User's request: "${prompt}"`,
    });

    return llmResponse.text;
  }
);
