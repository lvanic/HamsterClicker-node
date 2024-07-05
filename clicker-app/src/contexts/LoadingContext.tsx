import {
  FC,
  ReactNode,
  createContext,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";

interface LoadingContextProps {
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextProps | undefined>(
  undefined
);

interface LoadingProviderProps {
  children: ReactNode;
}

const LoadingProvider: FC<LoadingProviderProps> = ({ children }) => {
  const [isPageLoading, setIsLoading] = useState<boolean>(false);

  const setPageLoading = useCallback((loading: boolean) => {
    console.log("Setting page loading to", loading);

    setIsLoading(loading);
  }, []);

  return (
    <LoadingContext.Provider value={{ isPageLoading, setPageLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export { LoadingContext, LoadingProvider };
