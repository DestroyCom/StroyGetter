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
