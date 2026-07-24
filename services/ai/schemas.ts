import { z } from 'zod';

export const AIEditorialResponseSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  category: z.string().default('Geral'),
  tags: z.array(z.string()).default([]),
});

export type AIEditorialResponse = z.infer<typeof AIEditorialResponseSchema>;
