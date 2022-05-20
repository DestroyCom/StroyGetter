import { useEffect } from "react";

import { useDispatch } from "react-redux";

import "../styles/App.css";
import Header from "./Header";
import Input from "./Input";
import Infos from "./Infos";
import Results from "./Results";
import {
  setDownloadErrors,
  setInfosErrors,
} from "../helpers/redux/slices/errorsSlice";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setInfosErrors("Your video will be there soon !"));
    dispatch(setDownloadErrors(null));
  }, []);

  return (
    <>
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
