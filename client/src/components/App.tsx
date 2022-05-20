import React from "react";
import { useState } from "react";

import { saveAs } from "file-saver";

import { useSelector, useDispatch } from "react-redux";

import { setUrl } from "../helpers/redux/slices/urlSlice";

import "../styles/App.css";
import Header from "./Header";
import Input from "./Input";
import Infos from "./Infos";
import Results from "./Results";

function App() {
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
