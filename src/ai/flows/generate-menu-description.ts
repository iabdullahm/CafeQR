'use server';
/**
 * @fileOverview Optimized AI flow for generating menu item descriptions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMenuDescriptionInputSchema = z.object({
  itemName: z.string().describe('The name of the menu item.'),
  ingredients: z.string().describe('Key ingredients.'),
  cuisineType: z.string().optional().describe('Category (e.g., "Dessert", "Coffee").'),
  tasteProfile: z.string().optional().describe('Brief taste/texture profile.'),
});
export type GenerateMenuDescriptionInput = z.infer<typeof GenerateMenuDescriptionInputSchema>;

const GenerateMenuDescriptionOutputSchema = z.object({
  description: z.string().describe('Enticing, short description.'),
});
export type GenerateMenuDescriptionOutput = z.infer<typeof GenerateMenuDescriptionOutputSchema>;

export async function generateMenuDescription(input: GenerateMenuDescriptionInput): Promise<GenerateMenuDescriptionOutput> {
  return generateMenuDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMenuDescriptionPrompt',
  input: {schema: GenerateMenuDescriptionInputSchema},
  output: {schema: GenerateMenuDescriptionOutputSchema},
  prompt: `You are a professional cafe menu writer.
Generate a very short, appetizing description (MAX 30 words) for:
Item: {{{itemName}}}
Ingredients: {{{ingredients}}}
{{#if cuisineType}}Type: {{{cuisineType}}}{{/if}}
{{#if tasteProfile}}Notes: {{{tasteProfile}}}{{/if}}`,
});

const generateMenuDescriptionFlow = ai.defineFlow(
  {
    name: 'generateMenuDescriptionFlow',
    inputSchema: GenerateMenuDescriptionInputSchema,
    outputSchema: GenerateMenuDescriptionOutputSchema,
  },
  async input => {
    // Standard generation (no streaming) for efficiency and lower overhead
    const {output} = await prompt(input);
    return output!;
  }
);
