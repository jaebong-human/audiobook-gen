#!/usr/bin/env node

/**
 * Resume pipeline: reads existing descriptor.json files from public/content/
 * and generates any missing images and audio, then rebuilds episodes.json.
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import ora from "ora";
import chalk from "chalk";
import {
  setApiKey,
  setTypecastClient,
  generateAiImage,
  generateVoiceTypecast,
  transcribeAudio,
} from "./service";
import type { StoryDescriptor } from "../src/lib/types";
import { execSync } from "child_process";

dotenv.config();

function createFallbackImage(outputPath: string) {
  try {
    execSync(
      `ffmpeg -f lavfi -i "color=c=black:s=1792x1024:d=1" -frames:v 1 -update 1 "${outputPath}" -y`,
      { stdio: "ignore" }
    );
  } catch {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync(outputPath, png);
  }
}

function splitTitle(title: string): { white: string; red: string } {
  const words = title.split(" ");
  if (words.length <= 1) {
    return { white: "TRUE", red: title.toUpperCase() };
  }
  return { white: words[0].toUpperCase(), red: words.slice(1).join(" ").toUpperCase() };
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  const typecastApiKey = process.env.TYPECAST_API_KEY;

  if (!apiKey) {
    console.error(chalk.red("OPENAI_API_KEY not set in .env"));
    process.exit(1);
  }
  if (!typecastApiKey) {
    console.error(chalk.red("TYPECAST_API_KEY not set in .env"));
    process.exit(1);
  }

  setApiKey(apiKey);
  await setTypecastClient(typecastApiKey);

  const contentDir = path.join(process.cwd(), "public", "content");
  const slugs = fs.readdirSync(contentDir).filter((name) => {
    const descriptorPath = path.join(contentDir, name, "descriptor.json");
    return fs.existsSync(descriptorPath);
  });

  if (slugs.length === 0) {
    console.log(chalk.yellow("No content directories with descriptor.json found."));
    process.exit(0);
  }

  console.log(chalk.blue(`\nFound ${slugs.length} episode(s): ${slugs.join(", ")}\n`));

  const allEpisodes: any[] = [];

  for (const slug of slugs) {
    const descriptorPath = path.join(contentDir, slug, "descriptor.json");
    const descriptor: StoryDescriptor = JSON.parse(
      fs.readFileSync(descriptorPath, "utf-8")
    );

    console.log(chalk.blue(`\n🎬 Processing: "${descriptor.shortTitle}" (${slug})\n`));

    const imagesDir = path.join(contentDir, slug, "images");
    const audioDir = path.join(contentDir, slug, "audio");
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.mkdirSync(audioDir, { recursive: true });

    const total = descriptor.content.length;

    for (let i = 0; i < total; i++) {
      const item = descriptor.content[i];
      const imagePath = path.join(imagesDir, `${item.uid}.png`);
      const audioPath = path.join(audioDir, `${item.uid}.mp3`);

      // Image
      if (fs.existsSync(imagePath) && fs.statSync(imagePath).size > 100) {
        console.log(chalk.gray(`  [${i + 1}/${total}] Image exists, skipping`));
      } else {
        const spinner = ora(`  [${i + 1}/${total}] Generating image...`).start();
        try {
          await generateAiImage({
            prompt: item.imageDescription,
            path: imagePath,
            onRetry: (attempt) => {
              spinner.text = `  [${i + 1}/${total}] Retrying image (${attempt})...`;
            },
          });
          spinner.succeed(chalk.green(`  [${i + 1}/${total}] Image generated`));
        } catch {
          spinner.warn(chalk.yellow(`  [${i + 1}/${total}] Image failed, using fallback`));
          createFallbackImage(imagePath);
        }
      }

      // Audio
      if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 100) {
        if (!item.wordTimestamps || item.wordTimestamps.length === 0) {
          const spinner = ora(`  [${i + 1}/${total}] Transcribing existing audio...`).start();
          try {
            item.wordTimestamps = await transcribeAudio(audioPath);
            spinner.succeed(chalk.green(`  [${i + 1}/${total}] Transcription complete`));
          } catch (err) {
            spinner.fail(chalk.red(`  [${i + 1}/${total}] Transcription failed: ${err}`));
            throw err;
          }
        } else {
          console.log(chalk.gray(`  [${i + 1}/${total}] Audio exists, skipping`));
        }
      } else {
        const spinner = ora(`  [${i + 1}/${total}] Generating voice...`).start();
        try {
          item.wordTimestamps = await generateVoiceTypecast(
            item.text,
            descriptor.voiceId,
            audioPath,
          );
          spinner.succeed(chalk.green(`  [${i + 1}/${total}] Voice generated`));
        } catch (err) {
          spinner.fail(chalk.red(`  [${i + 1}/${total}] Voice failed: ${err}`));
          throw err;
        }
      }
    }

    // Save updated descriptor
    fs.writeFileSync(descriptorPath, JSON.stringify(descriptor, null, 2));
    console.log(chalk.green(`  Descriptor updated.`));

    // Build episode entry
    allEpisodes.push({
      id: slug,
      title: splitTitle(descriptor.shortTitle),
      voiceActor: descriptor.voiceActor,
      scenes: descriptor.content.map((item) => ({
        image: `content/${slug}/images/${item.uid}.png`,
        audio: `content/${slug}/audio/${item.uid}.mp3`,
        wordTimestamps: item.wordTimestamps || [],
      })),
    });
  }

  // Write episodes.json
  const episodesPath = path.join(process.cwd(), "src", "data", "episodes.json");
  fs.mkdirSync(path.dirname(episodesPath), { recursive: true });
  fs.writeFileSync(episodesPath, JSON.stringify(allEpisodes, null, 2));
  console.log(chalk.green(`\n✅ episodes.json updated with ${allEpisodes.length} episode(s)`));

  console.log(chalk.green.bold("\n✨ Resume complete!\n"));
  console.log("Preview: " + chalk.blue("npm run studio"));
  console.log(
    "Render:  " + chalk.blue(`npm run build`)
  );
}

main().catch((err) => {
  console.error(chalk.red("\n❌ Error:"), err);
  process.exit(1);
});
