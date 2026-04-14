import { Composition, CalculateMetadataFunction, Folder } from "remotion";
import { staticFile } from "remotion";
import { Episode } from "./Episode";
import { getAudioDuration } from "./get-audio-duration";
import { EpisodeData } from "./types";
import episodes from "./data/episodes.json";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const DEFAULT_SCENE_GAP_SECONDS = 0.5;

type EpisodeCompositionProps = {
  episode: EpisodeData;
  sceneDurations: number[];
  sceneGapSeconds: number;
};

const calculateEpisodeMetadata: CalculateMetadataFunction<
  EpisodeCompositionProps
> = async ({ props }) => {
  const durations = await Promise.all(
    props.episode.scenes.map((scene) =>
      getAudioDuration(staticFile(scene.audio))
    )
  );

  const sceneDurationsInFrames = durations.map((d) => Math.ceil(d * FPS));
  const gapDuration = Math.round(props.sceneGapSeconds * FPS);
  const titleDuration = 3 * FPS;
  const blackDuration = 2 * FPS;
  const totalScenes = sceneDurationsInFrames.reduce((a, b) => a + b, 0);
  const totalGaps = sceneDurationsInFrames.length * gapDuration;
  const totalDuration =
    titleDuration + totalScenes + totalGaps + blackDuration;

  return {
    durationInFrames: totalDuration,
    props: {
      ...props,
      sceneDurations: sceneDurationsInFrames,
    },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="Episodes">
      {(episodes as EpisodeData[]).map((ep) => (
        <Composition
          key={ep.id}
          id={ep.id}
          component={Episode}
          durationInFrames={300}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{
            episode: ep,
            sceneDurations: [],
            sceneGapSeconds: DEFAULT_SCENE_GAP_SECONDS,
          }}
          calculateMetadata={calculateEpisodeMetadata}
        />
      ))}
    </Folder>
  );
};
