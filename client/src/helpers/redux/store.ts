import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import { persistReducer } from "redux-persist";

import downloadHistorySlice from "./slices/downloadHistorySlice";
import urlSlice from "./slices/urlSlice";
import infosSlice from "./slices/infosSlice";
import errorsSlice from "./slices/errorsSlice";

const reducers = combineReducers({
  downloadHistory: downloadHistorySlice,
  url: urlSlice,
  infos: infosSlice,
  errors: errorsSlice,
});

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, reducers);

const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
