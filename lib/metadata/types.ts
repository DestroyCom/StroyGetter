export interface SongMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  trackNumber?: number;
  genre?: string;
  coverUrl?: string;
  label?: string;
}

export interface MetadataProvider {
  name: string;
  apiKey?: string;
  search(query: { artist: string; title: string }): Promise<SongMetadata | null>;
}
