import React from "react";
import "./Loader.css";

const Loader: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center">
      <img src="./img/preview.png" className="absolute w-screen h-screen" />
      <div className="flex flex-col justify-center items-center z-10">
        <div className="text-3xl">Chickencoin</div>
        <div className="text-xl">to the moon</div>
        <div className="loader mt-4"></div>
      </div>
    </div>
  );
};

export default Loader;
