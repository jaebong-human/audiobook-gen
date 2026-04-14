# audiobook-gen

[English](./README.md) | [한국어](./README.ko.md)

AI 기반 오디오북 영상 생성기. AI 이미지, TTS 내레이션, 영화적 전환 효과로 내레이션 영상을 자동 제작합니다.

## 파이프라인

```
입력 (제목 + 주제 또는 스크립트 파일)
  → GPT-4.1: 스토리 생성
  → GPT-4.1: 장면별 이미지 프롬프트 생성
  → DALL-E 3: 일러스트 생성 (1792x1024)
  → Typecast: TTS 내레이션
  → Whisper: 단어 단위 타임스탬프
  → Remotion: 영상 렌더링 (1920x1080)
출력: MP4 영상
```

## 사전 요구사항

- Node.js >= 18
- ffmpeg (컴필레이션 렌더링 및 폴백 이미지용)

## 설치

```bash
npm install
cp .env.example .env
```

`.env` 파일에 API 키를 입력하세요:

```
OPENAI_API_KEY=
TYPECAST_API_KEY=
TYPECAST_VOICE_ID=             # 선택사항
```

### API 키 발급

| 키 | 발급처 |
|-----|-------------|
| `OPENAI_API_KEY` | [OpenAI API Keys](https://platform.openai.com/api-keys) |
| `TYPECAST_API_KEY` | [Typecast API Key](https://typecast.ai/developers/api/api-key) |
| `TYPECAST_VOICE_ID` | [Typecast Voices](https://typecast.ai/developers/api/voices) (선택, 기본값 Jeff)

## 사용법

### 영상 생성

```bash
# 호러
npm run gen -- --title "The Night Shift" --topic "horror"

# 역사 / 다큐멘터리
npm run gen -- --title "The Fall of Rome" --topic "history"

# 동화
npm run gen -- --title "The Moon Rabbit" --topic "fairy tale"

# 과학
npm run gen -- --title "Life on Mars" --topic "science"

# 직접 작성한 스크립트 사용
npm run gen -- --title "My Story" --script story.txt

# 인터랙티브 모드
npm run gen
```

### 미리보기 & 렌더링

```bash
# Remotion Studio에서 미리보기
npm run studio

# 단일 에피소드 렌더링
npx remotion render <episode-id> out/<episode-id>.mp4

# 전체 에피소드를 하나의 컴필레이션으로 렌더링
npm run build
```

## 영상 스타일

- **타이틀 카드**: 검정 배경 위 굵은 텍스트
- **전환**: 2초 검정 화면을 사이에 둔 하드 컷
- **워터마크**: 하단에 성우 크레딧 표시
- **페이드/디졸브 없음** — 깔끔하고 선명한 컷

## 프로젝트 구조

```
audiobook-gen/
├── cli/                    # 생성 파이프라인
│   ├── cli.ts              # CLI 진입점 (yargs)
│   ├── service.ts          # API 호출 (OpenAI, DALL-E, Typecast, Whisper)
│   └── pipeline.ts         # 파이프라인 오케스트레이션
├── src/                    # Remotion 영상 컴포넌트
│   ├── components/
│   │   ├── TitleCard.tsx    # 에피소드 타이틀 카드
│   │   ├── BlackScreen.tsx  # 검정 전환 화면
│   │   ├── StoryScene.tsx   # 이미지 + 내레이션 오디오
│   │   └── Watermark.tsx    # 하단 크레딧 오버레이
│   ├── Episode.tsx          # 에피소드 컴포지션 (Series 시퀀싱)
│   ├── Root.tsx             # 컴포지션 등록
│   └── data/episodes.ts    # 에피소드 메타데이터 (파이프라인이 자동 업데이트)
├── public/content/          # 생성된 콘텐츠 (gitignore 처리됨)
├── scripts/render-all.sh    # 일괄 렌더링 + ffmpeg concat
└── .env.example
```

## API 요구사항

| 서비스 | 용도 |
|---------|---------|
| OpenAI GPT-4.1 | 스토리 + 이미지 프롬프트 생성 |
| OpenAI DALL-E 3 | 이미지 생성 |
| Typecast | TTS 내레이션 |
| OpenAI Whisper | 단어 단위 타임스탬프 추출 |

## 라이선스

MIT
