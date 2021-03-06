import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Menu, MenuItem, MenuButton } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/slide.css";
import { SpinnerCircular } from "spinners-react";
import {
  MusicNoteIcon,
  VideoCameraIcon,
  ChevronDownIcon,
  DownloadIcon,
} from "@heroicons/react/solid";

import { download, getExtension } from "../helpers/function/downloader";
import { setDownloadErrors } from "../helpers/redux/slices/errorsSlice";

import { DataResProps } from "../helpers/types/types";
import { getAPIURL } from "../helpers/function/getAPIURL";

const DataResults = ({
  qualityList,
  name,
  thumbnailUrl,
  channelName,
}: DataResProps) => {
  const [qualityValue, setQualityValue] = useState("Choose quality");
  const [itag, setItag] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [isProcess, setIsProcess] = useState(false);

  const dispatch = useDispatch();

  const url = useSelector((state: any) => state.url.string);
  const downloadErrors = useSelector(
    (state: any) => state.errors.getDownloadError
  );

  const handleDownload = (e: React.MouseEvent) => {
    dispatch(setDownloadErrors(null));

    if (itag === "" && qualityValue === "Choose quality") {
      dispatch(setDownloadErrors("Please choose a quality first !"));
      return;
    }

    var apiUrl;

    var API_URL = getAPIURL();

    if (mimeType.includes("audio")) {
      apiUrl = `${API_URL}/api/download-audio?url=${url}&itag=${itag}`;
    } else {
      apiUrl = `${API_URL}/api/download-video?url=${url}&itag=${itag}`;
    }

    setIsProcess(true);

    fetch(apiUrl, {
      method: "get",
    })
      .then((response) => {
        if (!response.ok) {
          return;
        }
        var extension;

        if (mimeType.includes("audio")) {
          extension = "mp3";
        } else {
          extension = getExtension(mimeType);
        }
        let fileName = `${name} - ${channelName} - ${qualityValue}.${extension}`;
        response.blob().then((blob) => download(blob, fileName));
        return response;
      })
      .catch((err) => console.error(err))
      .then(() => {
        setTimeout(() => {
          setIsProcess(false);
        }, 5000);
      });
  };

  return (
    <div className="w-[75%] h-[20vh] border-solid border-2 border-[#102F42] flex flex-row justify-evenly mx-auto my-12 p-2">
      <div className="w-[40%]">
        <img
          src={thumbnailUrl}
          alt={'Thumbnail of "' + name + '"'}
          className="max-h-[100%] m-auto rounded-lg "
        />
      </div>

      <div className="flex flex-col text-lg mx-2 my-auto w-[40%]">
        <div className="flex flex-col p-2">
          <p className="italic">{name}</p>
          <p className="font-bold">{channelName}</p>
        </div>
        <div className="flex flex-row justify-start w-[85%]">
          <Menu
            menuButton={
              <MenuButton
                className={
                  (downloadErrors
                    ? "border-solid border-2 border-[#720915] text-[#720915]"
                    : "") +
                  " " +
                  "rounded-lg bg-[#102F42] flex flex-row justify-between p-2 w-[50%] max-w-[20vh] mr-[10%]"
                }
              >
                <p className="m-auto">{qualityValue}</p>
                <ChevronDownIcon className="m-auto max-w-[20%]" />
              </MenuButton>
            }
            transition
          >
            {qualityList.map((quality: any) => (
              <MenuItem
                key={quality.quality + "-" + quality.mimeType}
                value={quality.itag}
                className="font-bold justify-between"
                onClick={(e) => {
                  setQualityValue(quality.quality);
                  setItag(e.value);
                  setMimeType(quality.mimeType);
                  e.stopPropagation = true;
                  e.keepOpen = false;
                }}
              >
                {quality.quality === "audio" ? (
                  <MusicNoteIcon className="h-5 w-5" />
                ) : (
                  <VideoCameraIcon className="h-5 w-5" />
                )}
                <p>{quality.quality}</p>
                {/* <p>{JSON.stringify(quality)}</p> */}
              </MenuItem>
            ))}
          </Menu>
          <div
            onClick={(e) => handleDownload(e)}
            className={
              (qualityValue != "Choose quality"
                ? "hover:bg-[#1C5273] hover:border-[#102F42] hover:cursor-pointer"
                : "opacity-25") +
              " " +
              "flex flex-row transition-all ease-in-out bg-[#102F42] border-2 border-transparent text-white font-bold py-2 px-4 rounded-lg" +
              " " +
              (isProcess ? "opacity-50 cursor-not-allowed" : null)
            }
          >
            <p className="my-auto mx-2">DOWNLOAD</p>
            {isProcess ? (
              <SpinnerCircular />
            ) : (
              <DownloadIcon className="h-5 w-5 m-auto" />
            )}
          </div>
        </div>
        {downloadErrors && (
          <p className="font-bold italic text-[#720915]">{downloadErrors}</p>
        )}
      </div>
    </div>
  );
};

export default DataResults;
