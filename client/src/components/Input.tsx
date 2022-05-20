import axios from "axios";
import { useDispatch } from "react-redux";
import { useState } from "react";

import {
  setChannelName,
  setName,
  setQualityList,
  setThumbnailUrl,
} from "../helpers/redux/slices/infosSlice";
import { setUrl } from "../helpers/redux/slices/urlSlice";

const Input = () => {
  const dispatch = useDispatch();

  const [stateUrl, setStateUrl] = useState(null);

  const getInfo = async (e: React.MouseEvent) => {
    axios
      .get(`http://localhost:3100/api/get-infos?url=${stateUrl}`)
      .then((res) => {
        console.log(res.data);
        dispatch(setUrl(stateUrl));
        dispatch(setName(res.data.videoDetails.title));
        dispatch(
          setThumbnailUrl(
            res.data.videoDetails.thumbnails[
              res.data.videoDetails.thumbnails.length - 1
            ].url
          )
        );
        dispatch(setChannelName(res.data.videoDetails.ownerChannelName));
        dispatch(setQualityList(res.data.formats));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="flex flex-col h-[20vh] w-[45%] m-auto p-8">
      <div className="flex flex-col">
        <input
          type="text"
          id="url"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 my-4"
          onChange={(e) => setStateUrl(e.target.value)}
        />

        <button
          type="submit"
          className="text-white bg-[#205D83] hover:bg-[#102F42] focus:ring-2 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-[#205D83] border-solid border-1 border-transparent text-lg m-auto hover:border-[#205D83] hover:ring-[#205D83]"
          onClick={(e) => getInfo(e)}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Input;
