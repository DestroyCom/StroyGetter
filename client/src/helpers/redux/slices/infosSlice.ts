import { createSlice } from "@reduxjs/toolkit";

import { infosState } from "../../types/types";

const initialState: infosState = {
  name: "",
  qualityList: [],
  thumbnailUrl: "",
  channelName: "",
};

export const infosSlice = createSlice({
  name: "infos",
  initialState,
  reducers: {
    setName(state, action) {
      state.name = action.payload;
    },
    setQualityList(state, action) {
      state.qualityList = [];

      action.payload.forEach(
        (
          quality: {
            mimeType: string;
            qualityLabel: string;
            bitrate: number;
            itag: string;
          },
          index: number
        ) => {
          if (
            quality.mimeType.includes("video/webm") ||
            quality.mimeType.includes("audio/webm")
          )
            return;

          console.log("qualityLabel", quality.qualityLabel);
          console.log("state.qualityList", state.qualityList);

          //Search for same qualityLabel
          let sameQualityLabel = state.qualityList.find(
            (qualityItem: any) => qualityItem.quality === quality.qualityLabel
          );

          console.log("sameQualityLabel", sameQualityLabel);

          if (sameQualityLabel) {
            if (sameQualityLabel.bitrate < quality.bitrate) {
              if (quality.qualityLabel === null) {
                quality.qualityLabel = "audio";
              }
              state.qualityList[state.qualityList.length] = {
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
        }
      );
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
