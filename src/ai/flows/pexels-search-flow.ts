
'use server';

/**
 * @fileOverview This file defines Genkit flows for searching images and videos on Pexels.
 *
 * - pexelsImageSearch - A function that takes a query and returns image results from Pexels.
 * - PexelsImageSearchInput - The input type for the pexelsImageSearch function.
 * - PexelsImageSearchOutput - The return type for the pexelsImageSearch function.
 *
 * - pexelsVideoSearch - A function that takes a query and returns video results from Pexels.
 * - PexelsVideoSearchInput - The input type for the pexelsVideoSearch function.
 * - PexelsVideoSearchOutput - The return type for the pexelsVideoSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createClient, ErrorResponse } from 'pexels';

//================================================================
// Image Search Flow
//================================================================

const PexelsImageSearchInputSchema = z.object({
  query: z.string().describe('The search term for images.'),
});
export type PexelsImageSearchInput = z.infer<typeof PexelsImageSearchInputSchema>;

const ImageResultSchema = z.object({
    id: z.number(),
    url: z.string().url(),
    photographer: z.string(),
    alt: z.string().nullable(),
});

const PexelsImageSearchOutputSchema = z.object({
  images: z.array(ImageResultSchema).describe('The list of image results from Pexels.'),
});
export type PexelsImageSearchOutput = z.infer<typeof PexelsImageSearchOutputSchema>;

// This function is exported and can be called directly from your server-side components.
export async function pexelsImageSearch(
  input: PexelsImageSearchInput
): Promise<PexelsImageSearchOutput> {
  return pexelsImageSearchFlow(input);
}


const pexelsImageSearchFlow = ai.defineFlow(
  {
    name: 'pexelsImageSearchFlow',
    inputSchema: PexelsImageSearchInputSchema,
    outputSchema: PexelsImageSearchOutputSchema,
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


//================================================================
// Video Search Flow
//================================================================

const PexelsVideoSearchInputSchema = z.object({
  query: z.string().describe('The search term for videos.'),
});
export type PexelsVideoSearchInput = z.infer<typeof PexelsVideoSearchInputSchema>;

const VideoResultSchema = z.object({
    id: z.number(),
    url: z.string().url(),
    image: z.string().url().describe('The URL of the video thumbnail.'),
    user: z.object({ name: z.string() }),
});

const PexelsVideoSearchOutputSchema = z.object({
  videos: z.array(VideoResultSchema).describe('The list of video results from Pexels.'),
});
export type PexelsVideoSearchOutput = z.infer<typeof PexelsVideoSearchOutputSchema>;

export async function pexelsVideoSearch(
  input: PexelsVideoSearchInput
): Promise<PexelsVideoSearchOutput> {
  return pexelsVideoSearchFlow(input);
}

const pexelsVideoSearchFlow = ai.defineFlow(
  {
    name: 'pexelsVideoSearchFlow',
    inputSchema: PexelsVideoSearchInputSchema,
    outputSchema: PexelsVideoSearchOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      throw new Error('Pexels API key is not configured. Please add PEXELS_API_KEY to your .env file.');
    }
    
    const client = createClient(apiKey);

    try {
      const response = await client.videos.search({ query: input.query, per_page: 20 });
      
      if ('error' in response) {
         throw new Error(`Pexels API Error: ${(response as ErrorResponse).error}`);
      }

      // Filter for videos that have HD video files available
      const videos = response.videos
        .map(video => {
            const hdFile = video.video_files.find(f => f.quality === 'hd');
            return hdFile ? { ...video, url: hdFile.link } : null;
        })
        .filter((v): v is NonNullable<typeof v> => v !== null) // Type guard to filter out nulls
        .map(({ id, url, image, user }) => ({ id, url, image, user }));
        
      return { videos };

    } catch (error) {
      console.error("Failed to fetch videos from Pexels:", error);
      throw new Error("An error occurred while searching for videos on Pexels.");
    }
  }
);
