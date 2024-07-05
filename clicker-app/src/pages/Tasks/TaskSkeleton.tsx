import React from "react";

export const TaskSkeleton: React.FC = () => {
  return (
    <>
      <ul className="list-none p-0">
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <li
              key={index}
              className="p-3 my-2 bg-white bg-opacity-20 rounded-md flex justify-between items-center shadow-sm animate-pulse"
            >
              <div className="bg-gray-300 w-1/5 h-12 mr-2 rounded-xl"></div>
              <div className="bg-gray-300 w-1/2 h-6 mr-2 rounded"></div>
              <div className="bg-gray-300 w-1/4 h-6 rounded"></div>
            </li>
          ))}
      </ul>
    </>
  );
};
