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
      val: "En",
    },
    {
      code: "zh",
      val: "中文",
    },
  ];
  return (
    <div className="flex flex-col items-center space-y-4 z-20">
      <div className="relative z-20">
        <button
          className="p-2 border border-gray-300 rounded-md bg-[#1c1c1c]"
          onClick={toggleDropdown}
        >
          {languages.find((lang) => lang.code === selectedLanguage)?.val}
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
                {lang.val}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
