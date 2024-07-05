import React from "react";

export const ClickerSkeleton: React.FC = () => {
  return (
    <>
      <div className="bg-gray-300 w-36 h-10 mb-4 rounded animate-pulse"></div>
      <div className="mb-4 flex flex-row">
        <div className="bg-gray-300 w-20 h-20 mr-2 rounded-full animate-pulse"></div>
        <div className="bg-gray-100 w-32 h-20 rounded-xl animate-pulse"></div>
      </div>
      <div
        className="bg-gray-300 w-full h-80 mb-4 rounded-full animate-pulse"
        // style={{ width: "24.25rem", height: "24.25rem" }}
      ></div>
      <div className="bg-gray-300 w-full h-6 mb-4 rounded animate-pulse"></div>
    </>
  );
};
