import { z } from "zod";
import * as fs from "fs";

const IMAGE_WIDTH = 1792;
const IMAGE_HEIGHT = 1024;

let openaiApiKey: string | null = null;
let typecastClient: any = null;

export const setApiKey = (key: string) => {
  openaiApiKey = key;
};

export const setTypecastClient = async (apiKey: string) => {
  const { TypecastClient } = await import("@neosapience/typecast-js");
  typecastClient = new TypecastClient({ apiKey });
};

export const openaiStructuredCompletion = async <T>(
  prompt: string,
  schema: z.ZodType<T>,
): Promise<T> => {
  const jsonSchema = z.toJSONSchema(schema);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "response",
          schema: {
            type: jsonSchema.type || "object",
            properties: jsonSchema.properties,
            required: jsonSchema.required,
            additionalProperties: jsonSchema.additionalProperties ?? false,
          },
          strict: true,
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);

  const data = await res.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error("No content in OpenAI response");

  return schema.parse(JSON.parse(content));
};

export const getGenerateStoryPrompt = (title: string, topic: string) => {
  return `Write a short story with title [${title}] (its topic is [${topic}]).
You must follow best practices for great storytelling.
The script must be 8-10 sentences long.
Result without any formatting and title, as one continuous text.
Skip new lines.`;
};

export const getGenerateImageDescriptionPrompt = (storyText: string) => {
  return `You are given a story text.
Generate (in English) 5-8 very detailed image descriptions for this story.
Each image must depict a cinematic, visually compelling scene matching the story.
Return their description as json array with story sentences matched to images.
Story sentences must be in the same order as in the story and their content must be preserved.
Each image must match 1-2 sentences from the story.
Images should be photorealistic, cinematic, and atmospheric.
IMPORTANT: Image descriptions must be safe for AI image generation. Do NOT include gore, violence, blood, or disturbing content.
Give output in json format:

[
  {
    "text": "....",
    "imageDescription": "..."
  }
]

<story>
${storyText}
</story>`;
};

export const generateAiImage = async ({
  prompt,
  path,
  onRetry,
}: {
  prompt: string;
  path: string;
  onRetry: (attempt: number) => void;
}) => {
  const maxRetries = 3;
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        size: `${IMAGE_WIDTH}x${IMAGE_HEIGHT}`,
        response_format: "b64_json",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const buffer = Buffer.from(data.data[0].b64_json, "base64");
      fs.writeFileSync(path, new Uint8Array(buffer));
      return;
    } else {
      lastError = new Error(
        `OpenAI image error (attempt ${attempt + 1}): ${await res.text()}`
      );
      attempt++;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      onRetry(attempt);
    }
  }

  throw lastError!;
};

export const getVoiceName = async (
  voiceId: string,
): Promise<string> => {
  const voices = await typecastClient.getVoiceById(voiceId);
  if (!voices.length || !voices[0].voice_name) {
    throw new Error(`Voice not found for ID: ${voiceId}`);
  }
  return voices[0].voice_name;
};

export const generateVoiceTypecast = async (
  text: string,
  voiceId: string,
  outputPath: string,
): Promise<void> => {

  const audio = await typecastClient.textToSpeech({
    text,
    voice_id: voiceId,
    model: "ssfm-v30",
    output: { audio_format: "mp3" },
  });

  await fs.promises.writeFile(outputPath, new Uint8Array(audio.audioData));
};
