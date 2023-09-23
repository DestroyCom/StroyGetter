import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";

import { list } from "../../types/types";

const initialState: list = {
  list: [],
};

export const downloadHistorySlice = createSlice({
  name: "downloadHistory",
  initialState,
  reducers: {
    addDownloadHistory(state, action) {
      state.list.push(action.payload);
    },
  },
});

// Selectors
export const getUser = (state: any) => state.downloadHistorySlice;

// Reducers and actions
export const { addDownloadHistory } = downloadHistorySlice.actions;

export default downloadHistorySlice.reducer;
