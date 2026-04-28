import { z } from 'zod';

export const ApiOk = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ code: z.literal(0), data, message: z.string().optional() });

export const ApiErr = z.object({
  code: z.number().int(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type ApiErrShape = z.infer<typeof ApiErr>;
