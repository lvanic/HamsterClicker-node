import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const LanguageSelector = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [selectedLanguage, setSelectedLanguage] = useState(
    params.get("lang") || localStorage.getItem("language") || "en"
  );
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event: any) => {
    const newLanguage = event;
    setSelectedLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
    setDropdownVisible(false);

    params.set("lang", newLanguage);
    navigate(`?${params.toString()}`, { replace: true });
  };

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  const languages = [
    {
      code: "en",
      flag: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 32 32"
        >
          <rect
            x="1"
            y="4"
            width="30"
            height="24"
            rx="4"
            ry="4"
            fill="#fff"
          ></rect>
          <path
            fill="#be2a2a"
            d="M31 14L18 14 18 4 14 4 14 14 1 14 1 18 14 18 14 28 18 28 18 18 31 18 31 14z"
          ></path>
          <path
            d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
            opacity=".15"
          ></path>
          <path
            d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
            fill="#fff"
            opacity=".2"
          ></path>
        </svg>
      ),
    },
    {
      code: "zh",
      flag: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 32 32"
        >
          <rect
            x="1"
            y="4"
            width="30"
            height="24"
            rx="4"
            ry="4"
            fill="#db362f"
          ></rect>
          <path
            d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
            opacity=".15"
          ></path>
          <path
            fill="#ff0"
            d="M7.958 10.152L7.19 7.786 6.421 10.152 3.934 10.152 5.946 11.614 5.177 13.979 7.19 12.517 9.202 13.979 8.433 11.614 10.446 10.152 7.958 10.152z"
          ></path>
          <path
            fill="#ff0"
            d="M12.725 8.187L13.152 8.898 13.224 8.072 14.032 7.886 13.269 7.562 13.342 6.736 12.798 7.361 12.035 7.037 12.461 7.748 11.917 8.373 12.725 8.187z"
          ></path>
          <path
            fill="#ff0"
            d="M14.865 10.372L14.982 11.193 15.37 10.46 16.187 10.602 15.61 10.007 15.997 9.274 15.253 9.639 14.675 9.044 14.793 9.865 14.048 10.23 14.865 10.372z"
          ></path>
          <path
            fill="#ff0"
            d="M15.597 13.612L16.25 13.101 15.421 13.13 15.137 12.352 14.909 13.149 14.081 13.179 14.769 13.642 14.541 14.439 15.194 13.928 15.881 14.391 15.597 13.612z"
          ></path>
          <path
            fill="#ff0"
            d="M13.26 15.535L13.298 14.707 12.78 15.354 12.005 15.062 12.46 15.754 11.942 16.402 12.742 16.182 13.198 16.875 13.236 16.047 14.036 15.827 13.26 15.535z"
          ></path>
          <path
            d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
            fill="#fff"
            opacity=".2"
          ></path>
        </svg>
      ),
    },
  ];
  return (
    <div className="flex flex-col items-center space-y-4 z-20">
      <div className="relative z-20">
        <button
          className="p-2 border border-gray-300 rounded-md bg-[#1c1c1c]"
          onClick={toggleDropdown}
        >
          {languages.find((lang) => lang.code === selectedLanguage)?.flag}
        </button>
        {dropdownVisible && ( // Conditional rendering of dropdown
          <div className="absolute left-0 right-0 mt-1 bg-[#1c1c1c] border border-gray-300 rounded-md shadow-md">
            {languages.map((lang) => (
              <div
                key={lang.code}
                onClick={() => handleChange(lang.code)}
                className={
                  "flex items-center p-2 cursor-pointer " +
                  (lang.code === selectedLanguage ? "bg-[#6b6b6b]" : "bg-black")
                }
              >
                {lang.flag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
