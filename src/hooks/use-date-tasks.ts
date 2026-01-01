"use client";

import { useQuery } from "@tanstack/react-query";
import { getTasksByDate } from "@/actions";

export function useDateTasks(date: string) {
  return useQuery({
    queryKey: ["dateTasks", date],
    queryFn: async () => {
      const result = await getTasksByDate({ date });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!date,
  });
}
