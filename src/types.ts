export type Scene = {
  image: string;
  audio: string;
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
