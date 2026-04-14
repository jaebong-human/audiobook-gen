import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/Oswald";

const { fontFamily } = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

type TitleCardProps = {
  white: string;
  red: string;
};

export const TitleCard: React.FC<TitleCardProps> = ({ white, red }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: 72,
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.3,
          textTransform: "uppercase",
        }}
      >
        <span style={{ color: "white" }}>{white} </span>
        <span style={{ color: "#ff0000" }}>{red}</span>
      </div>
    </AbsoluteFill>
  );
};
