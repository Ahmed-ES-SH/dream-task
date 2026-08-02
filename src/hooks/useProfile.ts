import { useQuery } from "@tanstack/react-query";

import { profileRequest } from "@/lib/api";
import { useAuth } from "@/store/auth";

export function useProfile() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["profile"],
    queryFn: profileRequest,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
