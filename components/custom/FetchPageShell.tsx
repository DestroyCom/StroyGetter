"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";

interface DownloadState {
  isDownloading: boolean;
  setIsDownloading: Dispatch<SetStateAction<boolean>>;
}

const DownloadStateContext = createContext<DownloadState>({
  isDownloading: false,
  setIsDownloading: () => {},
});

export function useDownloadState() {
  return useContext(DownloadStateContext);
}

export function FetchPageShell({ children }: { children: ReactNode }) {
  const [isDownloading, setIsDownloading] = useState(false);
  return (
    <DownloadStateContext.Provider value={{ isDownloading, setIsDownloading }}>
      {children}
    </DownloadStateContext.Provider>
  );
}
