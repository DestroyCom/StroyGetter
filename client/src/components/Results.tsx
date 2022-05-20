import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useState } from "react";

import { Menu, MenuItem, MenuButton } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/slide.css";

import {
  MusicNoteIcon,
  VideoCameraIcon,
  ChevronDownIcon,
} from "@heroicons/react/solid";

import { download, getExtension } from "../helpers/function/downloader";

type AppProps = {
  qualityList: any;
  name: string;
  thumbnailUrl: string;
  channelName: string;
};

const Placeholder = () => {
  return (
    <div className="w-[75%] h-[20vh] border-dashed border-2 border-[#102F42] flex mx-auto my-12">
      <p className="m-auto">Your video will be there soon !</p>
    </div>
  );
};

const DataRes = ({
  qualityList,
  name,
  thumbnailUrl,
  channelName,
}: AppProps) => {
  const [qualityValue, setQualityValue] = useState("Choose quality");
  const [itag, setItag] = useState(null);
  const [mimeType, setMimeType] = useState("");

  const url = useSelector((state: any) => state.url.string);

  const handleDownload = (e: React.MouseEvent) => {
    fetch(`http://localhost:3100/api/download-video?url=${url}&itag=${itag}`, {
      method: "get",
    })
      .then((response) => {
        let extension = getExtension(mimeType);
        let fileName = `${name} - ${channelName} - ${qualityValue}.${extension}`;
        response.blob().then((blob) => download(blob, fileName));
        return response;
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="w-[75%] h-[20vh] border-solid border-2 border-[#102F42] flex flex-row justify-evenly mx-auto my-12 p-2">
      <img
        src={thumbnailUrl}
        alt={'Thumbnail of "' + name + '"'}
        className="max-h-[90%] my-auto rounded-lg"
      />
      <div className="flex flex-col text-lg mx-2 my-auto">
        <div className="flex flex-col p-2">
          <p className="italic">{name}</p>
          <p className="font-bold">{channelName}</p>
        </div>
        <div className="flex flex-row justify-around w-[85%]">
          <Menu
            menuButton={
              <MenuButton className="rounded-lg bg-[#102F42] flex flex-row justify-between p-2 w-[50%]">
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
              </MenuItem>
            ))}
          </Menu>
          <button type="submit" onClick={(e) => handleDownload(e)}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

const Results = () => {
  const qualityList = useSelector((state: any) => state.infos.qualityList);
  const name = useSelector((state: any) => state.infos.name);
  const thumbnailUrl = useSelector((state: any) => state.infos.thumbnailUrl);
  const channelName = useSelector((state: any) => state.infos.channelName);

  return (
    <>
      {qualityList && name && thumbnailUrl ? (
        <DataRes
          qualityList={qualityList}
          name={name}
          thumbnailUrl={thumbnailUrl}
          channelName={channelName}
        />
      ) : (
        <Placeholder />
      )}
    </>
  );
};

export default Results;
