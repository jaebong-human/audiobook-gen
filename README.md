# audiobook-gen

[English](./README.md) | [한국어](./README.ko.md)

AI-powered audiobook video generator. Automatically creates narrated videos with AI-generated images, TTS voiceover, and cinematic transitions.

## Pipeline

```
Input (title + topic or script file)
  → GPT-4.1: Story generation
  → GPT-4.1: Scene image prompts
  → DALL-E 3: Illustration generation (1792x1024)
  → Typecast: TTS narration
  → Whisper: Word-level timestamps
  → Remotion: Video rendering (1920x1080)
Output: MP4 video
```

## Prerequisites

- Node.js >= 18
- ffmpeg (for compilation rendering and fallback images)

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your API keys:

```
OPENAI_API_KEY=
TYPECAST_API_KEY=
TYPECAST_VOICE_ID=             # optional
```

### Getting API Keys

| Key | Where to get |
|-----|-------------|
| `OPENAI_API_KEY` | [OpenAI API Keys](https://platform.openai.com/api-keys) |
| `TYPECAST_API_KEY` | [Typecast API Key](https://typecast.ai/developers/api/api-key) |
| `TYPECAST_VOICE_ID` | [Typecast Voices](https://typecast.ai/developers/api/voices) (optional, defaults to Jeff)

## Usage

### Generate a video

```bash
# Horror story
npm run gen -- --title "The Night Shift" --topic "horror"

# History / documentary
npm run gen -- --title "The Fall of Rome" --topic "history"

# Fairy tale
npm run gen -- --title "The Moon Rabbit" --topic "fairy tale"

# Science
npm run gen -- --title "Life on Mars" --topic "science"

# Use your own script
npm run gen -- --title "My Story" --script story.txt

# Interactive mode
npm run gen
```

### Preview & Render

```bash
# Preview in Remotion Studio
npm run studio

# Render a single episode
npx remotion render <episode-id> out/<episode-id>.mp4

# Render all episodes into a compilation
npm run build
```

## Video Style

- **Title card**: Bold text on black background
- **Transitions**: Hard cut with 2-second black screen
- **Watermark**: Voice actor credit at bottom
- **No fade/dissolve** — clean, sharp cuts

## Project Structure

```
audiobook-gen/
├── cli/                    # Generation pipeline
│   ├── cli.ts              # CLI entry (yargs)
│   ├── service.ts          # API calls (OpenAI, DALL-E, Typecast, Whisper)
│   └── pipeline.ts         # Pipeline orchestration
├── src/                    # Remotion video components
│   ├── components/
│   │   ├── TitleCard.tsx    # Episode title card
│   │   ├── BlackScreen.tsx  # Black transition screen
│   │   ├── StoryScene.tsx   # Image + narration audio
│   │   └── Watermark.tsx    # Bottom credit overlay
│   ├── Episode.tsx          # Episode composition (Series sequencing)
│   ├── Root.tsx             # Composition registration
│   └── data/episodes.ts    # Episode metadata (auto-updated by pipeline)
├── public/content/          # Generated content (gitignored)
├── scripts/render-all.sh    # Batch render + ffmpeg concat
└── .env.example
```

## API Requirements

| Service | Purpose |
|---------|---------|
| OpenAI GPT-4.1 | Story + image prompt generation |
| OpenAI DALL-E 3 | Image generation |
| Typecast | TTS narration |
| OpenAI Whisper | Word timestamp extraction |

## License

MIT
