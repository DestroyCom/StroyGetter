export type PlaceholderProps = {
  name: string;
};

export type DataResProps = {
  qualityList: any;
  name: string;
  thumbnailUrl: string;
  channelName: string;
};

export interface list {
  list: string[];
}

export interface ErrorsState {
  getInfosError: null | string;
  getDownloadError: null | string;
}

export interface infosState {
  name: null | string;
  qualityList: {
    bitrate: number;
    mimeType: string;
    quality: string;
    itag: string;
  }[];
  thumbnailUrl: null | string;
  channelName: null | string;
}
