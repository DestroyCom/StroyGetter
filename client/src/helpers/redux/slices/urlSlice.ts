import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  string: "",
} as const;

export const urlSlice = createSlice({
  name: "url",
  initialState,
  reducers: {
    setUrl(state, action) {
      state.string = action.payload;
    },
  },
});

// Selectors
export const getUrl = (state: any) => state.urlSlice;

// Reducers and actions
export const { setUrl } = urlSlice.actions;

export default urlSlice.reducer;
