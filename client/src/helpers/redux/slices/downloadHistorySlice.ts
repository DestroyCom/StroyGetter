import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";

interface list {
  list: string[];
}

// Define the initial state using that type
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
