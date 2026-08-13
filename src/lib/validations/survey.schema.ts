import { z } from "zod";

const rating = z
  .string()
  .transform((val) => Number(val))
  .pipe(z.number().int().min(1).max(5));

export const surveySchema = z.object({
  ratingContent: rating,
  ratingInstructor: rating,
  ratingLogistics: rating,
  ratingGeneral: rating,
  comments: z.string().trim().optional().or(z.literal("")),
});

export type SurveyInput = z.infer<typeof surveySchema>;
