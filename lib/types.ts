export interface FormatData {
  itag: number;
  qualityLabel: string;
  formatId?: string; // e.g. "720p60", "1080p60__source" — Twitch format_id strings
}

export interface VideoData {
  video_details: {
    id?: string;
    title: string;
    description: string;
    duration: string;
    thumbnail: string;
    author: string;
  };
  format: FormatData[];
}

export const TIKTOK_ITAG = {
  WATERMARK: 301,
  NO_WATERMARK: 302,
  AUDIO: 303,
} as const;

export type TikTokItag = (typeof TIKTOK_ITAG)[keyof typeof TIKTOK_ITAG];

export const TWITCH_ITAG = {
  AUDIO: 401,
  VIDEO_BASE: 410,
} as const;

export type TwitchItag = (typeof TWITCH_ITAG)[keyof typeof TWITCH_ITAG];

export interface TikTokPhotoImage {
  url: string;
  width: number;
  height: number;
}

export interface TikTokPhotoData {
  type: "photo";
  images: TikTokPhotoImage[];
  video_details: {
    title: string;
    author: string;
    thumbnail: string;
  };
}
