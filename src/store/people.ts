"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { PersonCreate } from "@/lib/schemas";
import { keys } from "./keys";

/** The people they are building gifts for, in the order they were added. */
export const peopleQuery = queryOptions({ queryKey: keys.people, queryFn: api.people.list });

export const usePeople = () => useQuery(peopleQuery);

/**
 * Add someone. Not shown before the server answers: on the free plan the
 * answer for a second person is the offer, and that is the server's to say.
 */
export function useAddPerson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: PersonCreate) => api.people.create(input),
    onSuccess: (person) => {
      client.setQueryData(peopleQuery.queryKey, (people = []) => [...people, person]);
      void client.invalidateQueries({ queryKey: keys.people });
    },
  });
}
