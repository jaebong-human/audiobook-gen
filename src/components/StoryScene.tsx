import { AbsoluteFill, Img, staticFile } from "remotion";
import { Audio } from "@remotion/media";

type StorySceneProps = {
  image: string;
  audio: string;
};

export const StoryScene: React.FC<StorySceneProps> = ({ image, audio }) => {
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
    </AbsoluteFill>
  );
};
