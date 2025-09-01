
'use server';

/**
 * @fileOverview This file defines a Genkit flow for performing a Google search.
 *
 * - googleSearch - A function that takes a search query and returns search results.
 * - GoogleSearchInput - The input type for the googleSearch function.
 * - GoogleSearchOutput - The return type for the googleSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { defineTool } from 'genkit';

// Note: In a real app, you would likely have more complex logic
// to handle different types of search results (videos, images, etc.)
// and potentially use different tools for each.
const googleSearchTool = defineTool(
    {
        name: 'googleSearch',
        description: 'Performs a Google search for the given query and returns a list of web results.',
        inputSchema: z.object({ query: z.string() }),
        outputSchema: z.any(),
    },
    async (input) => {
        // Dynamically import search to avoid build issues
        const { search } = await import('@genkit-ai/googleai');
        return await search({ q: input.query });
    }
);


const GoogleSearchInputSchema = z.object({
  query: z.string().describe('The search term.'),
});
export type GoogleSearchInput = z.infer<typeof GoogleSearchInputSchema>;

const SearchResultSchema = z.object({
    title: z.string().describe('The title of the search result.'),
    link: z.string().describe('The URL of the search result.'),
    snippet: z.string().describe('A brief snippet of the search result content.')
});

const GoogleSearchOutputSchema = z.object({
  results: z.array(SearchResultSchema).describe('A list of search results.'),
});
export type GoogleSearchOutput = z.infer<typeof GoogleSearchOutputSchema>;


export async function googleSearch(
  input: GoogleSearchInput
): Promise<GoogleSearchOutput> {
  return googleSearchFlow(input);
}


const prompt = ai.definePrompt({
    name: 'googleSearchPrompt',
    input: { schema: GoogleSearchInputSchema },
    output: { schema: GoogleSearchOutputSchema },
    tools: [googleSearchTool],
    prompt: `Perform a Google search for {{{query}}}. Return the results.`
});


const googleSearchFlow = ai.defineFlow(
  {
    name: 'googleSearchFlow',
    inputSchema: GoogleSearchInputSchema,
    outputSchema: GoogleSearchOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    const toolResponse = llmResponse.toolRequest?.tool.response;

    if (!toolResponse) {
      return { results: [] };
    }
    
    // Extract the relevant fields from the tool's response
    const results = toolResponse.results.map((r: any) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
    }));
    
    return { results };
  }
);
