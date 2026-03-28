import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getServerSession } from "./server";

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  return await getServerSession();
});

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: ["auth", "session"],
    queryFn: () => getSession(),
  });
}
