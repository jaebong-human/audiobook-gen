import React from "react";
import { Series, useVideoConfig, AbsoluteFill, Img, staticFile } from "remotion";
import { TitleCard } from "./components/TitleCard";
import { BlackScreen } from "./components/BlackScreen";
import { StoryScene } from "./components/StoryScene";
import { Watermark } from "./components/Watermark";
import { EpisodeData } from "./types";

type EpisodeProps = {
  episode: EpisodeData;
  sceneDurations: number[];
  sceneGapSeconds: number;
};

export const Episode: React.FC<EpisodeProps> = ({
  episode,
  sceneDurations,
  sceneGapSeconds,
}) => {
  const { fps } = useVideoConfig();
  const titleDuration = 3 * fps;
  const blackDuration = 2 * fps;
  const gapDuration = Math.round(sceneGapSeconds * fps);

  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={titleDuration} premountFor={fps}>
          <TitleCard white={episode.title.white} red={episode.title.red} />
        </Series.Sequence>
        {episode.scenes.map((scene, i) => (
          <React.Fragment key={i}>
            <Series.Sequence
              durationInFrames={sceneDurations[i] + gapDuration}
              premountFor={fps}
            >
              <StoryScene image={scene.image} audio={scene.audio} />
            </Series.Sequence>
          </React.Fragment>
        ))}
        <Series.Sequence durationInFrames={blackDuration} premountFor={fps}>
          <BlackScreen />
        </Series.Sequence>
      </Series>
      <Watermark voiceActor={episode.voiceActor} />
    </AbsoluteFill>
  );
};
