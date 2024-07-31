import React from "react";

const MaintenanceNotice: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center">
      <img src="./img/preview.png" className="absolute w-screen h-screen" />
      <div className="flex flex-col justify-center items-center z-10">
        <div className="flex flex-col justify-center items-center w-3/4 text-center">
          <div className="text-3xl">Technical works</div>
          <div className="text-xl">
            Sorry right now our service is not available
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceNotice;
