export interface FormatData {
  itag: number;
  qualityLabel: string;
}

export interface VideoData {
  video_details: {
    title: string;
    description: string;
    duration: string;
    thumbnail: string;
    author: string;
  };
  format: FormatData[];
}
