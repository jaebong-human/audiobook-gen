export type WordTimestamp = {
  word: string;
  start: number;
  end: number;
};

export type Scene = {
  image: string;
  audio: string;
  wordTimestamps: WordTimestamp[];
};

export type EpisodeData = {
  id: string;
  title: {
    white: string;
    red: string;
  };
  voiceActor: string;
  scenes: Scene[];
};
