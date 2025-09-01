
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

const googleSearchTool = ai.defineTool(
    {
        name: 'googleSearch',
        description: 'Performs a Google search for the given query and returns a list of web results.',
        inputSchema: z.object({ query: z.string() }),
        outputSchema: z.object({
            results: z.array(SearchResultSchema).describe('A list of search results.'),
        }),
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


const GoogleSearchInputSchema = z.object({
  query: z.string().describe('The search term.'),
});
export type GoogleSearchInput = z.infer<typeof GoogleSearchInputSchema>;


const GoogleSearchOutputSchema = z.object({
  answer: z.string().describe('A helpful, summarized answer based on the search results.'),
  results: z.array(SearchResultSchema).describe('A list of the source search results.'),
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
    output: { schema: z.object({ answer: z.string() }) },
    tools: [googleSearchTool],
    prompt: `Perform a Google search for {{{query}}}. Then, analyze the search results to answer the user's query.`
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

    if (!toolResponse || !toolResponse.results) {
      return { answer: "Sorry, I couldn't find any information about that.", results: [] };
    }
    
    const output = llmResponse.output()
    
    return { 
        answer: output?.answer || "I found some results, but I couldn't summarize them.",
        results: toolResponse.results 
    };
  }
);
