import { useContext, useEffect, useState } from "react";
import { DataContext } from "../contexts/DataContext";

export const useSettings = () => {
  const context = useContext(DataContext);
  if (!context || !context.settings) {
    throw new Error("DataContext required");
  }
  return { ...context.settings };
};
