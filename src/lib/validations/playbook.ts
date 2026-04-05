import { z } from "zod";

export const playbookSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().nullable(),
  rules: z.string().optional().nullable(),
  timeframes: z.array(z.string()).default([]),
  entryConditions: z.string().optional().nullable(),
  invalidConditions: z.string().optional().nullable(),
  targetRrMin: z.number().positive().optional().nullable(),
  targetRrMax: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  checklist: z
    .array(z.object({ item: z.string(), required: z.boolean().default(false) }))
    .optional()
    .nullable(),
});

export type PlaybookFormValues = z.infer<typeof playbookSchema>;
