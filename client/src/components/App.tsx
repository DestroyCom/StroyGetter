import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Helmet } from "react-helmet";

import Header from "./Header";
import Input from "./Input";
import Infos from "./Infos";
import Results from "./Results";

import {
  setDownloadErrors,
  setInfosErrors,
} from "../helpers/redux/slices/errorsSlice";

import "../styles/App.css";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setInfosErrors("Your video will be there soon !"));
    dispatch(setDownloadErrors(null));
  }, []);

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>StroyGetter - Free Youtube Downloader</title>
        <link
          rel="icon"
          type="image/png"
          href={"/src/assets/img/logo.svg"}
          sizes="16x16"
        />
      </Helmet>
      <div className="h-[65vh] w-[100%] bg-[#102F42] text-red-50">
        <Header />
        <Infos />
        <Input />
      </div>
      <Results />
    </>
  );
}

export default App;
