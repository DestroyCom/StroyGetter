import { Innertube } from "youtubei.js";

let instance: Innertube | null = null;

export async function getInnertube(): Promise<Innertube> {
  if (!instance) {
    instance = await Innertube.create({ retrieve_player: false });
  }
  return instance;
}

const VIDEO_ID_RE =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/))([a-zA-Z0-9_-]{11})/;

export function extractVideoId(url: string): string | null {
  const match = url.match(VIDEO_ID_RE);
  return match ? match[1] : null;
}
