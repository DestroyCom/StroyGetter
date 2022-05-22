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
import { setInfosErrors } from "../helpers/redux/slices/errorsSlice";
import { getAPIURL } from "../helpers/function/getAPIURL";

const Input = () => {
  const dispatch = useDispatch();

  const [stateUrl, setStateUrl] = useState<string | null>(null);

  const getInfo = async (e: React.MouseEvent) => {
    dispatch(setUrl(null));
    dispatch(setName(null));
    dispatch(setThumbnailUrl(null));
    dispatch(setChannelName(null));
    dispatch(setQualityList([]));

    if (stateUrl === null || stateUrl === "") {
      dispatch(setInfosErrors("Please enter a url first !"));
      return;
    }

    dispatch(setName(""));

    var API_URL = getAPIURL();

    axios
      .get(`${API_URL}/api/get-infos?url=${stateUrl}`)
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
        console.log("err", err);
        dispatch(setInfosErrors(err.response.data.message));
        dispatch(setUrl(null));
        dispatch(setName(null));
        dispatch(setThumbnailUrl(null));
        dispatch(setChannelName(null));
        dispatch(setQualityList([]));
      });
  };

  return (
    <div className="flex flex-col h-[20vh] w-[45%] m-auto p-8">
      <div className="flex flex-col">
        <input
          type="text"
          id="url"
          name="url"
          placeholder="https://www.youtube.com/watch?v=[video-id]"
          className="bg-[#081721] border border-[#081721] text-white rounded-full focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 my-4"
          onChange={(e) => setStateUrl(e.target.value)}
        />

        <button
          type="submit"
          className="text-white bg-[#205D83] hover:bg-[#102F42] focus:ring-2 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-[#205D83] border-solid border-1 border-transparent text-lg m-auto hover:border-[#205D83] hover:ring-[#205D83]"
          onClick={(e) => getInfo(e)}
        >
          SEARCH
        </button>
      </div>
    </div>
  );
};

export default Input;
