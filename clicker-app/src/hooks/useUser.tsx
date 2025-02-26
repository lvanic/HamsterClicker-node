import { useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";

export const useUser = () => {
  const context = useContext(UserContext);
  const user = context?.user;
  const setUser = context?.setUser;
  return { user, setUser };
};
