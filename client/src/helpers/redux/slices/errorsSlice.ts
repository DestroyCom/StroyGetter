import { createSlice } from "@reduxjs/toolkit";

interface ErrorsState {
  getInfosError: null | string;
  getDownloadError: null | string;
}

const initialState: ErrorsState = {
  getInfosError: "Your video will be there soon !",
  getDownloadError: null,
};

export const errorsSlice = createSlice({
  name: "errors",
  initialState,
  reducers: {
    setInfosErrors: (state, action) => {
      state.getInfosError = action.payload;
    },
    setDownloadErrors: (state, action) => {
      state.getDownloadError = action.payload;
    },
  },
});

// Selectors
export const getUrl = (state: any) => state.errorsSlice;

// Reducers and actions
export const { setInfosErrors, setDownloadErrors } = errorsSlice.actions;

export default errorsSlice.reducer;
