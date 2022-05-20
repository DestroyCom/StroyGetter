import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  name: "",
  qualityList: [],
  thumbnailUrl: "",
  channelName: "",
} as const;

export const infosSlice = createSlice({
  name: "infos",
  initialState,
  reducers: {
    setName(state, action) {
      state.name = action.payload;
    },
    setQualityList(state, action) {
      state.qualityList = [];
      action.payload.forEach((quality: any, index: number) => {
        if (
          quality.mimeType.includes("video/webm") ||
          quality.mimeType.includes("audio/webm")
        )
          return;
        //Search for same qualityLabel
        let sameQualityLabel = state.qualityList.find(
          (qualityItem: any) => qualityItem.quality === quality.qualityLabel
        );

        if (sameQualityLabel) {
          if (sameQualityLabel.bitrate < quality.bitrate) {
            if (quality.qualityLabel === null) {
              quality.qualityLabel = "audio";
            }
            state.qualityList[index] = {
              mimeType: quality.mimeType,
              quality: quality.qualityLabel,
              bitrate: quality.bitrate,
              itag: quality.itag,
            };
          }
        } else {
          if (quality.qualityLabel === null) {
            quality.qualityLabel = "audio";
          }
          state.qualityList.push({
            mimeType: quality.mimeType,
            quality: quality.qualityLabel,
            bitrate: quality.bitrate,
            itag: quality.itag,
          });
        }
      });
    },
    setThumbnailUrl(state, action) {
      state.thumbnailUrl = action.payload;
    },
    setChannelName(state, action) {
      state.channelName = action.payload;
    },
  },
});

export const { setName, setQualityList, setThumbnailUrl, setChannelName } =
  infosSlice.actions;

export default infosSlice.reducer;
