'use server';
/**
 * @fileOverview A Genkit flow for generating engaging menu item descriptions.
 *
 * - generateMenuDescription - A function that handles the menu description generation process.
 * - GenerateMenuDescriptionInput - The input type for the generateMenuDescription function.
 * - GenerateMenuDescriptionOutput - The return type for the generateMenuDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMenuDescriptionInputSchema = z.object({
  itemName: z.string().describe('The name of the menu item.'),
  ingredients: z.string().describe('A list of key ingredients.'),
  cuisineType: z.string().optional().describe('The type of cuisine or category (e.g., "Dessert", "Coffee", "Appetizer").'),
  tasteProfile: z.string().optional().describe('A brief description of the taste and texture (e.g., "rich, creamy, slightly bitter").'),
  specialFeatures: z.string().optional().describe('Any unique selling points or special characteristics.'),
});
export type GenerateMenuDescriptionInput = z.infer<typeof GenerateMenuDescriptionInputSchema>;

const GenerateMenuDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated engaging and descriptive text for the menu item.'),
});
export type GenerateMenuDescriptionOutput = z.infer<typeof GenerateMenuDescriptionOutputSchema>;

export async function generateMenuDescription(input: GenerateMenuDescriptionInput): Promise<GenerateMenuDescriptionOutput> {
  return generateMenuDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMenuDescriptionPrompt',
  input: {schema: GenerateMenuDescriptionInputSchema},
  output: {schema: GenerateMenuDescriptionOutputSchema},
  prompt: `You are a skilled copywriter for a cafe menu, specializing in creating enticing and delicious-sounding descriptions.

Your task is to generate a short, engaging, and descriptive text for the following menu item, focusing on its appeal to customers. Highlight its key characteristics and flavors.

Menu Item: {{{itemName}}}
Ingredients: {{{ingredients}}}
{{#if cuisineType}}Category: {{{cuisineType}}}{{/if}}
{{#if tasteProfile}}Taste Profile: {{{tasteProfile}}}{{/if}}
{{#if specialFeatures}}Special Features: {{{specialFeatures}}}{{/if}}

Generate an appealing description in less than 50 words.`,
});

const generateMenuDescriptionFlow = ai.defineFlow(
  {
    name: 'generateMenuDescriptionFlow',
    inputSchema: GenerateMenuDescriptionInputSchema,
    outputSchema: GenerateMenuDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
