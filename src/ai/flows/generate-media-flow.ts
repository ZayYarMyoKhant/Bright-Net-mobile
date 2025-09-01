
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating media (image and video) based on a text prompt.
 *
 * - generateMedia - A function that takes a text prompt and returns URLs for a generated image and video.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import * as fs from 'fs';
import { Readable } from 'stream';

const GenerateMediaOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the generated image."),
  videoUrl: z.string().describe("The data URI of the generated video."),
});

async function toBase64(mediaPart: any): Promise<string> {
  const fetch = (await import('node-fetch')).default;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set.');
  }

  const url = `${mediaPart.media.url}&key=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download media: ${response.statusText}`);
  }

  const buffer = await response.buffer();
  return `data:${mediaPart.media.contentType};base64,${buffer.toString('base64')}`;
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const { media } = await ai.generate({
      model: googleAI.model('imagen-4.0-fast-generate-001'),
      prompt: `Generate a photorealistic, educational image about: ${prompt}`,
      config: {
        aspectRatio: '16:9',
      },
    });
    return media.url;
  }
);

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: `Generate a short, educational, looping video about: ${prompt}`,
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait for the operation to complete
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Check every 5 seconds
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      throw new Error(`Failed to generate video: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find((p) => !!p.media);
    if (!videoPart) {
      throw new Error('Failed to find the generated video in the operation result');
    }
    
    // The videoPart URL is temporary and needs to be downloaded and converted to a data URI
    const base64Video = await toBase64(videoPart);
    return base64Video;
  }
);


export async function generateMedia(prompt: string): Promise<{ imageUrl: string; videoUrl: string; }> {
    try {
        const [imageUrl, videoUrl] = await Promise.all([
            generateImageFlow(prompt),
            generateVideoFlow(prompt)
        ]);

        return { imageUrl, videoUrl };
    } catch (error) {
        console.error("Error in generateMedia:", error);
        throw error;
    }
}
