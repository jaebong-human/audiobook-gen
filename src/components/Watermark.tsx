import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/Roboto";

const { fontFamily } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

type WatermarkProps = {
  voiceActor: string;
};

export const Watermark: React.FC<WatermarkProps> = ({ voiceActor }) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 30,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: 28,
          color: "rgba(200, 200, 200, 0.8)",
          letterSpacing: 2,
        }}
      >
        Voice: {voiceActor} | Powered by Typecast
      </div>
    </AbsoluteFill>
  );
};
