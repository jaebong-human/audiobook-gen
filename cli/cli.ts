#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import prompts from "prompts";
import chalk from "chalk";
import * as dotenv from "dotenv";
import { runPipeline } from "./pipeline";

dotenv.config();

const DEFAULT_TYPECAST_VOICE_ID = "tc_67512e5af2b6dbabce63f92a"; // Jeff

interface GenerateOptions {
  apiKey?: string;
  typecastApiKey?: string;
  voiceId?: string;
  title?: string;
  topic?: string;
  script?: string;
}

async function generate(options: GenerateOptions) {
  try {
    let apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    let typecastApiKey = options.typecastApiKey || process.env.TYPECAST_API_KEY;
    const voiceId =
      options.voiceId || process.env.TYPECAST_VOICE_ID || DEFAULT_TYPECAST_VOICE_ID;

    if (!apiKey) {
      const response = await prompts({
        type: "password",
        name: "apiKey",
        message: "Enter your OpenAI API key:",
        validate: (value: string) => value.length > 0 || "API key is required",
      });
      if (!response.apiKey) {
        console.log(chalk.red("API key is required. Exiting..."));
        process.exit(1);
      }
      apiKey = response.apiKey;
    }

    if (!typecastApiKey) {
      const response = await prompts({
        type: "password",
        name: "typecastApiKey",
        message: "Enter your Typecast API key:",
        validate: (value: string) =>
          value.length > 0 || "Typecast API key is required",
      });
      if (!response.typecastApiKey) {
        console.log(chalk.red("Typecast API key is required. Exiting..."));
        process.exit(1);
      }
      typecastApiKey = response.typecastApiKey;
    }

    let { title, topic, script } = options;

    if (!title) {
      const response = await prompts({
        type: "text",
        name: "title",
        message: "Title of the story:",
        validate: (value: string) => value.length > 0 || "Title is required",
      });
      if (!response.title) {
        console.log(chalk.red("Title is required. Exiting..."));
        process.exit(1);
      }
      title = response.title;
    }

    if (!script && !topic) {
      const response = await prompts({
        type: "text",
        name: "topic",
        message: "Topic (e.g. horror, history, science, fairy tale):",
      });
      topic = response.topic || "general";
    }

    await runPipeline({
      apiKey: apiKey!,
      typecastApiKey: typecastApiKey!,
      voiceId,
      title: title!,
      topic,
      scriptPath: script,
    });
  } catch (error) {
    console.error(chalk.red("\n❌ Error:"), error);
    process.exit(1);
  }
}

yargs(hideBin(process.argv))
  .command(
    "generate",
    "Generate an audiobook video",
    (yargs) => {
      return yargs
        .option("api-key", {
          alias: "k",
          type: "string",
          description: "OpenAI API key",
        })
        .option("typecast-api-key", {
          type: "string",
          description: "Typecast API key",
        })
        .option("voice-id", {
          type: "string",
          description: "Typecast voice ID (default: tc_67512e5af2b6dbabce63f92a / Jeff)",
        })
        .option("title", {
          alias: "t",
          type: "string",
          description: "Title of the story",
        })
        .option("topic", {
          alias: "p",
          type: "string",
          description: "Topic (e.g. horror, history, science, fairy tale)",
        })
        .option("script", {
          alias: "s",
          type: "string",
          description: "Path to script file (.txt) - skips story generation",
        });
    },
    async (argv) => {
      await generate({
        apiKey: argv["api-key"],
        typecastApiKey: argv["typecast-api-key"],
        voiceId: argv["voice-id"],
        title: argv.title,
        topic: argv.topic,
        script: argv.script,
      });
    }
  )
  .demandCommand(1)
  .help()
  .alias("help", "h")
  .strict()
  .parse();
