import { z } from "zod";

export const StoryScript = z.object({
  text: z.string(),
});
export type StoryScript = z.infer<typeof StoryScript>;

export const StoryWithImages = z.object({
  result: z.array(
    z.object({
      text: z.string(),
      imageDescription: z.string(),
    })
  ),
});
export type StoryWithImages = z.infer<typeof StoryWithImages>;

export type WordTimestamp = {
  word: string;
  start: number;
  end: number;
};

export type ContentItemWithDetails = {
  text: string;
  imageDescription: string;
  uid: string;
  wordTimestamps: WordTimestamp[];
};

export type StoryDescriptor = {
  shortTitle: string;
  voiceActor: string;
  voiceId: string;
  content: ContentItemWithDetails[];
};
