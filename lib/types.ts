export interface FormatData {
  itag: number;
  qualityLabel: string;
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
