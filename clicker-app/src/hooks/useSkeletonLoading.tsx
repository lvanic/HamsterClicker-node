import { useUser } from "./useUser";

export const useSkeletonLoading = () => {
  const { user } = useUser();
  if (user) {
    return false;
  } else {
    return true;
  }
};
