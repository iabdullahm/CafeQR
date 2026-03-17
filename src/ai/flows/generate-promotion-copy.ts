'use server';
/**
 * @fileOverview A Genkit flow for generating marketing copy for cafe promotions.
 *
 * - generatePromotionCopy - A function that generates marketing copy based on promotion details.
 * - GeneratePromotionCopyInput - The input type for the generatePromotionCopy function.
 * - GeneratePromotionCopyOutput - The return type for the generatePromotionCopy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePromotionCopyInputSchema = z.object({
  promotionTitle: z
    .string()
    .describe('The title of the promotion, e.g., "New Summer Latte".'),
  promotionDetails: z
    .string()
    .describe(
      'Detailed description of the promotion, e.g., "Our new Summer Latte is made with fresh berries and a hint of mint. Perfect for a hot day!".'
    ),
  targetAudience: z
    .string()
    .describe('Who the promotion is for, e.g., "Students", "Coffee lovers", "Families".'),
  callToAction: z
    .string()
    .describe(
      'What action the customer should take, e.g., "Visit us today!", "Order online", "Tag a friend".'
    ),
  tone: z
    .string()
    .describe('The desired tone of the copy, e.g., "Excited", "Relaxed", "Elegant".'),
  platform: z
    .string()
    .describe('Where the copy will be used, e.g., "Instagram", "Newsletter", "Facebook".'),
});
export type GeneratePromotionCopyInput = z.infer<
  typeof GeneratePromotionCopyInputSchema
>;

const GeneratePromotionCopyOutputSchema = z.object({
  marketingCopy: z.string().describe('The generated marketing copy.'),
  hashtags: z
    .array(z.string())
    .describe('A list of relevant hashtags for the promotion.'),
  emojis: z
    .array(z.string())
    .describe('A list of relevant emojis to accompany the copy.'),
});
export type GeneratePromotionCopyOutput = z.infer<
  typeof GeneratePromotionCopyOutputSchema
>;

export async function generatePromotionCopy(
  input: GeneratePromotionCopyInput
): Promise<GeneratePromotionCopyOutput> {
  return generatePromotionCopyFlow(input);
}

const generatePromotionCopyPrompt = ai.definePrompt({
  name: 'generatePromotionCopyPrompt',
  input: {schema: GeneratePromotionCopyInputSchema},
  output: {schema: GeneratePromotionCopyOutputSchema},
  prompt: `You are an expert marketing copywriter for a cafe. Your task is to generate engaging marketing content for a promotion.
The copy should be tailored for the specified platform, audience, and tone.

**Promotion Details:**
Title: {{{promotionTitle}}}
Description: {{{promotionDetails}}}
Target Audience: {{{targetAudience}}}
Call to Action: {{{callToAction}}}
Tone: {{{tone}}}
Platform: {{{platform}}}

Generate creative marketing copy, relevant hashtags, and appropriate emojis. Ensure the copy is compelling and encourages the target audience to engage with the promotion.

Output format should be a JSON object conforming to the following schema:
${ai.jsonSchema(GeneratePromotionCopyOutputSchema)}`,
});

const generatePromotionCopyFlow = ai.defineFlow(
  {
    name: 'generatePromotionCopyFlow',
    inputSchema: GeneratePromotionCopyInputSchema,
    outputSchema: GeneratePromotionCopyOutputSchema,
  },
  async (input) => {
    const {output} = await generatePromotionCopyPrompt(input);
    if (!output) {
      throw new Error('Failed to generate marketing copy.');
    }
    return output;
  }
);
