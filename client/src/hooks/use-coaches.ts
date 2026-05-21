import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

type CreateReviewInput = {
  coachId: number;
  rating: number;
  comment: string;
};

// ============================================
// COACHES HOOKS
// ============================================

export function useCoaches(search?: string) {
  return useQuery({
    queryKey: [api.coaches.list.path, search],
    queryFn: async () => {
      const url = search 
        ? `${api.coaches.list.path}?search=${encodeURIComponent(search)}` 
        : api.coaches.list.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch coaches");
      return api.coaches.list.responses[200].parse(await res.json());
    },
  });
}

export function useCoach(id: number) {
  return useQuery({
    queryKey: [api.coaches.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.coaches.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch coach");
      return api.coaches.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// ============================================
// REVIEWS HOOKS
// ============================================

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateReviewInput) => {
      const res = await fetch(api.reviews.create.path, {
        method: api.reviews.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create review");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.coaches.get.path, variables.coachId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [api.coaches.list.path] 
      });
    },
  });
}
