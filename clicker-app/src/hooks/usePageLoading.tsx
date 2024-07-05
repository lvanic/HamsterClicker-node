import { useState, useEffect, useContext } from "react";
import { LoadingContext } from "../contexts/LoadingContext";

export const usePageLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  const isPageLoading = context?.isPageLoading;
  const setPageLoading = context?.setPageLoading;

  return { isPageLoading, setPageLoading };
};
