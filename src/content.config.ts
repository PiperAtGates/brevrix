import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    aiSummary: z.string().optional(), // AI Search (ChatGPT/Perplexity) quotes this
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("Sadia Afrin Lubna"),
    authorRole: z.string().default("Founder & Principal Systems Engineer"),
    category: z.string().default("DevOps & Engineering"),
    heroImage: z.string().optional(),
  }),
});

export const collections = { blog };

