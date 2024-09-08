import { useEffect, useState } from "react";
import { Business } from "../../models";

export const BusinessesFilter = ({
  businesses,
  onCategorySelect,
}: {
  businesses: Business[] | undefined;
  onCategorySelect: (category: string) => void;
}) => {
  const uniqueCategories = [
    //@ts-ignore
    ...new Set(businesses.map((business) => business.category)),
  ];
  const [selectedCategory, setSelectedCategory] = useState<string>(
    uniqueCategories[0]?.toLocaleLowerCase()
  );

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    onCategorySelect(category);
  };
  useEffect(() => {
    setSelectedCategory(uniqueCategories[0]?.toLocaleLowerCase());
  }, [uniqueCategories[0]]);

  return (
    <div className="flex flex-row items-center justify-between w-full bg-[#323232 mb-4">
      {uniqueCategories.map((category) => (
        <button
          key={category}
          className={`p-2 text-xs rounded-lg ${
            selectedCategory?.toLocaleLowerCase() === category?.toLocaleLowerCase() ? "bg-[#323232]" : ""
          }`}
          onClick={() => handleCategoryClick(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};
