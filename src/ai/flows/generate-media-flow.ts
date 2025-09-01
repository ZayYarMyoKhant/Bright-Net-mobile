'use server';

/**
 * @fileOverview A Genkit flow for generating media based on a text prompt.
 *
 * - generateMedia - A function that generates images using an AI model.
 * - GenerateMediaInput - The input type for the generateMedia function.
 * - GenerateMediaOutput - The return type for the generateMedia function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMediaInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate media from.'),
});
export type GenerateMediaInput = z.infer<typeof GenerateMediaInputSchema>;

const GeneratedImageSchema = z.object({
  url: z.string().describe('The data URI of the generated image.'),
  prompt: z.string().describe('The prompt used to generate this image.'),
});

const GenerateMediaOutputSchema = z.object({
  images: z
    .array(GeneratedImageSchema)
    .describe('An array of generated images.'),
});
export type GenerateMediaOutput = z.infer<typeof GenerateMediaOutputSchema>;

export async function generateMedia(
  input: GenerateMediaInput
): Promise<GenerateMediaOutput> {
  return generateMediaFlow(input);
}

const generateMediaFlow = ai.defineFlow(
  {
    name: 'generateMediaFlow',
    inputSchema: GenerateMediaInputSchema,
    outputSchema: GenerateMediaOutputSchema,
  },
  async ({ prompt }) => {
    const imageCount = 12; // Generate 12 images

    // Create an array of promises for image generation
    const imagePromises = Array(imageCount)
      .fill(null)
      .map(async (_, index) => {
        const nuancedPrompt = `${prompt}, high quality photography, style of unsplash, ${index}`;
        const { media } = await ai.generate({
          model: 'googleai/imagen-4.0-fast-generate-001',
          prompt: nuancedPrompt,
        });
        return {
          url: media.url,
          prompt: nuancedPrompt,
        };
      });

    const images = await Promise.all(imagePromises);

    return {
      images,
    };
  }
);
