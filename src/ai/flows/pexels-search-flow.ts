'use server';

/**
 * @fileOverview This file defines a Genkit flow for searching images on Pexels.
 *
 * - pexelsSearch - A function that takes a query and returns image results from Pexels.
 * - PexelsSearchInput - The input type for the pexelsSearch function.
 * - PexelsSearchOutput - The return type for the pexelsSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createClient, ErrorResponse } from 'pexels';

const PexelsSearchInputSchema = z.object({
  query: z.string().describe('The search term for images.'),
});
export type PexelsSearchInput = z.infer<typeof PexelsSearchInputSchema>;

const ImageResultSchema = z.object({
    id: z.number(),
    url: z.string().url(),
    photographer: z.string(),
    alt: z.string().nullable(),
});

const PexelsSearchOutputSchema = z.object({
  images: z.array(ImageResultSchema).describe('The list of image results from Pexels.'),
});
export type PexelsSearchOutput = z.infer<typeof PexelsSearchOutputSchema>;

// This function is exported and can be called directly from your server-side components.
export async function pexelsSearch(
  input: PexelsSearchInput
): Promise<PexelsSearchOutput> {
  return pexelsSearchFlow(input);
}


const pexelsSearchFlow = ai.defineFlow(
  {
    name: 'pexelsSearchFlow',
    inputSchema: PexelsSearchInputSchema,
    outputSchema: PexelsSearchOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      throw new Error('Pexels API key is not configured. Please add PEXELS_API_KEY to your .env file.');
    }
    
    const client = createClient(apiKey);

    try {
      const response = await client.photos.search({ query: input.query, per_page: 20 });
      
      if ('error' in response) {
         throw new Error(`Pexels API Error: ${(response as ErrorResponse).error}`);
      }

      const images = response.photos.map(photo => ({
        id: photo.id,
        url: photo.src.large, // Using 'large' for better quality in the viewer
        photographer: photo.photographer,
        alt: photo.alt,
      }));

      return { images };

    } catch (error) {
      console.error("Failed to fetch from Pexels:", error);
      // Re-throw the error to be caught by the client-side caller
      throw new Error("An error occurred while searching for images on Pexels.");
    }
  }
);
