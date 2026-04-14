import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { WordTimestamp } from "../types";

type StorySceneProps = {
  image: string;
  audio: string;
  wordTimestamps: WordTimestamp[];
};

export const StoryScene: React.FC<StorySceneProps> = ({ image, audio, wordTimestamps }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const activeWords = wordTimestamps.filter((w) => w.start <= currentTime);
  const currentWordIndex = wordTimestamps.findIndex(
    (w) => currentTime >= w.start && currentTime < w.end
  );

  return (
    <AbsoluteFill>
      <Img
        src={staticFile(image)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <Audio src={staticFile(audio)} />
      {wordTimestamps.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 0,
            right: 0,
            textAlign: "center",
            padding: "0 60px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              padding: "12px 24px",
              borderRadius: 8,
            }}
          >
            {wordTimestamps.map((w, i) => (
              <span
                key={i}
                style={{
                  color: i === currentWordIndex ? "#FFD700" : i < activeWords.length ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                  fontSize: 36,
                  fontFamily: "Arial, sans-serif",
                  fontWeight: i === currentWordIndex ? "bold" : "normal",
                  marginRight: 6,
                }}
              >
                {w.word}
              </span>
            ))}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
