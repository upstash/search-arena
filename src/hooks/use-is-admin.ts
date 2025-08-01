import { trpc } from "@/api/trpc/client";

export const useIsAdmin = () => {
  const { data } = trpc.auth.isAdmin.useQuery();

  return {
    isAdmin: data,
  };
};
