import * as fs from "fs";
import * as path from "path";
import ora from "ora";
import chalk from "chalk";
import { v4 as uuidv4 } from "uuid";
import {
  setApiKey,
  setTypecastClient,
  openaiStructuredCompletion,
  getGenerateStoryPrompt,
  getGenerateImageDescriptionPrompt,
  generateAiImage,
  generateVoiceTypecast,
  getVoiceName,
} from "./service";
import {
  StoryScript,
  StoryWithImages,
  StoryDescriptor,
  ContentItemWithDetails,
} from "../src/lib/types";
import { execSync } from "child_process";

function createFallbackImage(outputPath: string) {
  try {
    execSync(
      `ffmpeg -f lavfi -i "color=c=black:s=1792x1024:d=1" -frames:v 1 -update 1 "${outputPath}" -y`,
      { stdio: "ignore" }
    );
  } catch {
    // ffmpeg 없으면 1x1 검은 PNG 생성
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync(outputPath, png);
  }
}

class ContentFS {
  slug: string;

  constructor(title: string) {
    this.slug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  getDir(subdir?: string): string {
    const segments = ["public", "content", this.slug];
    if (subdir) segments.push(subdir);
    const p = path.join(process.cwd(), ...segments);
    fs.mkdirSync(p, { recursive: true });
    return p;
  }

  getImagePath(uid: string): string {
    return path.join(this.getDir("images"), `${uid}.png`);
  }

  getAudioPath(uid: string): string {
    return path.join(this.getDir("audio"), `${uid}.mp3`);
  }

  saveDescriptor(descriptor: StoryDescriptor): void {
    const filePath = path.join(this.getDir(), "descriptor.json");
    fs.writeFileSync(filePath, JSON.stringify(descriptor, null, 2));
  }
}

export interface PipelineOptions {
  apiKey: string;
  typecastApiKey: string;
  voiceId: string;
  title: string;
  topic?: string;
  scriptPath?: string;
}

export async function runPipeline(options: PipelineOptions) {
  const { apiKey, typecastApiKey, voiceId, title, topic, scriptPath } = options;

  setApiKey(apiKey);
  await setTypecastClient(typecastApiKey);
  const contentFs = new ContentFS(title);

  console.log(chalk.blue(`\n🎬 Creating audiobook: "${title}"\n`));

  // Step 1: Get story text
  let storyText: string;

  if (scriptPath) {
    const spinner = ora("Reading script file...").start();
    storyText = fs.readFileSync(scriptPath, "utf-8").trim();
    spinner.succeed(chalk.green("Script loaded!"));
  } else {
    const spinner = ora("Generating story...").start();
    const storyRes = await openaiStructuredCompletion(
      getGenerateStoryPrompt(title, topic!),
      StoryScript
    );
    storyText = storyRes.text;
    spinner.succeed(chalk.green("Story generated!"));
  }

  console.log(chalk.gray(`\n${storyText}\n`));

  // Step 2: Generate image descriptions
  const descSpinner = ora("Generating image descriptions...").start();
  const storyWithImages = await openaiStructuredCompletion(
    getGenerateImageDescriptionPrompt(storyText),
    StoryWithImages
  );
  descSpinner.succeed(chalk.green("Image descriptions generated!"));

  const voiceActor = await getVoiceName(voiceId);

  const descriptor: StoryDescriptor = {
    shortTitle: title,
    voiceActor,
    voiceId,
    content: [],
  };

  for (const item of storyWithImages.result) {
    const contentItem: ContentItemWithDetails = {
      text: item.text,
      imageDescription: item.imageDescription,
      uid: uuidv4(),
      wordTimestamps: [],
    };
    descriptor.content.push(contentItem);
  }

  contentFs.saveDescriptor(descriptor);

  // Step 3 & 4: Generate images + TTS + Whisper
  const totalSteps = descriptor.content.length * 2;
  const mediaSpinner = ora("Generating images and voice...").start();

  for (let i = 0; i < descriptor.content.length; i++) {
    const item = descriptor.content[i];

    mediaSpinner.text = `[${i * 2 + 1}/${totalSteps}] Generating image: ${item.text.substring(0, 40)}...`;
    try {
      await generateAiImage({
        prompt: item.imageDescription,
        path: contentFs.getImagePath(item.uid),
        onRetry: (attempt) => {
          mediaSpinner.text = `[${i * 2 + 1}/${totalSteps}] Retrying image (${attempt})...`;
        },
      });
    } catch {
      mediaSpinner.text = `[${i * 2 + 1}/${totalSteps}] Image failed, using fallback...`;
      createFallbackImage(contentFs.getImagePath(item.uid));
    }

    mediaSpinner.text = `[${i * 2 + 2}/${totalSteps}] Generating voice: ${item.text.substring(0, 40)}...`;
    item.wordTimestamps = await generateVoiceTypecast(
      item.text,
      voiceId,
      contentFs.getAudioPath(item.uid),
    );

    contentFs.saveDescriptor(descriptor);
  }
  mediaSpinner.succeed(chalk.green("Images and voice generated!"));

  // Update public/episodes.json
  const updateSpinner = ora("Updating episodes index...").start();
  updateEpisodesJson(descriptor, contentFs.slug);
  updateSpinner.succeed(chalk.green("Episodes index updated!"));

  console.log(chalk.green.bold("\n✨ Episode generation complete!\n"));
  console.log(
    "Preview: " + chalk.blue("npm run studio")
  );
  console.log(
    "Render:  " + chalk.blue(`npx remotion render ${contentFs.slug} out/${contentFs.slug}.mp4`)
  );
}

function splitTitle(title: string): { white: string; red: string } {
  const words = title.split(" ");
  if (words.length <= 1) {
    return { white: "TRUE", red: title.toUpperCase() };
  }
  return { white: words[0].toUpperCase(), red: words.slice(1).join(" ").toUpperCase() };
}

function updateEpisodesJson(descriptor: StoryDescriptor, slug: string) {
  const episodesPath = path.join(process.cwd(), "src", "data", "episodes.json");

  let episodes: any[] = [];
  if (fs.existsSync(episodesPath)) {
    try {
      episodes = JSON.parse(fs.readFileSync(episodesPath, "utf-8"));
      episodes = episodes.filter((ep: any) => ep.id !== slug);
    } catch {
      episodes = [];
    }
  }

  episodes.push({
    id: slug,
    title: splitTitle(descriptor.shortTitle),
    voiceActor: descriptor.voiceActor,
    scenes: descriptor.content.map((item) => ({
      image: `content/${slug}/images/${item.uid}.png`,
      audio: `content/${slug}/audio/${item.uid}.mp3`,
      wordTimestamps: item.wordTimestamps,
    })),
  });

  fs.writeFileSync(episodesPath, JSON.stringify(episodes, null, 2));
}