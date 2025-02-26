import React from "react";
import "./Loader.css";
import { getLocalization } from "../../localization/getLocalization";

const Loader: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex flex-col items-center">
      <div
        className="text-[160px] z-20 p-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgb(255, 251, 201) 0%, rgb(139, 57, 16) 100%)",
          color: "transparent",
          backgroundClip: "text",
          lineHeight: 1,
        }}
      >
        BUN
      </div>
      <img src="bun.png" className="absolute mt-20 w-screen" />
      <div className="flex flex-col justify-center items-center z-10">
        {/* <div className="text-3xl">{getLocalization("chickenTap")}</div> */}
        {/* <div className="text-xl">to the moon</div> */}
        <div className="absolute loader bottom-16"></div>
      </div>
    </div>
  );
};

export default Loader;
