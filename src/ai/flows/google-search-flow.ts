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

const SearchResultSchema = z.object({
    title: z.string().describe('The title of the search result.'),
    link: z.string().describe('The URL of the search result.'),
    snippet: z.string().describe('A brief snippet of the search result content.')
});

const GoogleSearchInputSchema = z.object({
  query: z.string().describe('The search term.'),
});
export type GoogleSearchInput = z.infer<typeof GoogleSearchInputSchema>;


const GoogleSearchOutputSchema = z.object({
  results: z.array(SearchResultSchema).describe('A list of the source search results.'),
});
export type GoogleSearchOutput = z.infer<typeof GoogleSearchOutputSchema>;

const googleSearchTool = ai.defineTool(
    {
        name: 'googleSearch',
        description: 'Performs a Google search for the given query and returns a list of web results.',
        inputSchema: GoogleSearchInputSchema,
        outputSchema: GoogleSearchOutputSchema,
    },
    async (input) => {
        // Dynamically import search to avoid build issues
        const { search } = await import('@genkit-ai/googleai');
        const response = await search({ q: input.query });

        const results = response.web_results.map(r => ({
            title: r.title || 'No title',
            link: r.link || '',
            snippet: r.snippet || 'No snippet'
        }));

        return { results };
    }
);

export async function googleSearch(
  input: GoogleSearchInput
): Promise<GoogleSearchOutput> {
  return googleSearchFlow(input);
}

const googleSearchFlow = ai.defineFlow(
  {
    name: 'googleSearchFlow',
    inputSchema: GoogleSearchInputSchema,
    outputSchema: GoogleSearchOutputSchema,
  },
  async (input) => {
    const searchResult = await googleSearchTool(input);
    return searchResult;
  }
);