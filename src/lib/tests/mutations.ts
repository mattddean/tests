import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteTestAction } from "@/controllers";

import { throwOnError } from "../server-result";
import { testsKeys } from "./queries";

const deleteTest = throwOnError(deleteTestAction);

export function useDeleteTest() {
  const queryClient = useQueryClient();
  const deleteTestMutation = useMutation({
    mutationFn: deleteTest,
  });

  return {
    deleteTestMutation,
    deleteTest: async ({ testId }: { testId: string }) => {
      await deleteTestMutation.mutateAsync({ data: { id: testId } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: testsKeys.list("drafts") }),
        queryClient.invalidateQueries({ queryKey: testsKeys.list("published") }),
        queryClient.invalidateQueries({ queryKey: testsKeys.list("shared") }),
        queryClient.invalidateQueries({ queryKey: testsKeys.dashboard() }),
        queryClient.invalidateQueries({ queryKey: testsKeys.myResponses() }),
      ]);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === "tests" && query.queryKey.includes(testId),
      });
    },
  };
}
