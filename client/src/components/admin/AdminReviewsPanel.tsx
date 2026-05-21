import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Download, ExternalLink, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PendingReview {
  id: number;
  coachName: string;
  coachInstagram: string | null;
  coachEmail: string | null;
  coachPhone: string | null;
  coachWhatsapp: string | null;
  ratingResponseTime: number | null;
  ratingKnowledge: number | null;
  ratingResults: number | null;
  ratingCommunication: number | null;
  ratingAvailability: number | null;
  communicationStyle: string | null;
  comment: string;
  authorName: string;
  proofUrl: string | null;
  status: string | null;
  createdAt: string | null;
}

async function parseApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error(
      "Server returned a web page instead of API data. Restart with npm run dev, or redeploy after npm run build.",
    );
  }
  return JSON.parse(text) as T;
}

export function AdminReviewsPanel() {
  const { toast } = useToast();

  const { data: reviews, isLoading } = useQuery<PendingReview[]>({
    queryKey: ["/api/admin/reviews"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reviews", { credentials: "include" });
      if (!res.ok) {
        let message = "Failed to fetch reviews";
        if (res.status === 404) {
          message = "Reviews API not found. Restart or redeploy the server.";
        }
        throw new Error(message);
      }
      return parseApiJson<PendingReview[]>(res);
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/reviews/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({
        title: "Review Approved",
        description: "The review has been approved and is now visible.",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve review",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/reviews/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({
        title: "Review Rejected",
        description: "The review has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject review",
        variant: "destructive",
      });
    },
  });

  const renderStars = (rating: number | null) => {
    if (rating === null) return <span className="text-gray-400">N/A</span>;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "text-[#F5C518] fill-current" : "text-gray-200"}`}
          />
        ))}
      </div>
    );
  };

  const calculateOverallRating = (review: PendingReview): string | null => {
    const ratings = [
      review.ratingResponseTime,
      review.ratingKnowledge,
      review.ratingResults,
      review.ratingCommunication,
      review.ratingAvailability,
    ].filter((r): r is number => r !== null);
    if (ratings.length === 0) return null;
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return avg.toFixed(1);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#202020] mb-6" data-testid="text-pending-reviews-count">
        Pending Reviews ({reviews?.length ?? 0})
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No pending reviews to moderate.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {reviews?.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Review #{review.id}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Submitted{" "}
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => approveMutation.mutate(review.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="bg-green-600 text-white"
                      data-testid={`button-approve-${review.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => rejectMutation.mutate(review.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      variant="destructive"
                      data-testid={`button-reject-${review.id}`}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-[#202020] mb-3">Athlete Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name:</span>
                        <span className="font-medium">{review.authorName}</span>
                      </div>
                    </div>

                    <h4 className="font-semibold text-[#202020] mt-6 mb-3">Coach Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name:</span>
                        <span className="font-medium">{review.coachName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Instagram:</span>
                        <span className="font-medium">{review.coachInstagram || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="font-medium">{review.coachEmail || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium">{review.coachPhone || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">WhatsApp:</span>
                        <span className="font-medium">{review.coachWhatsapp || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#202020] mb-3">Ratings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center bg-[#F5C518]/10 p-2 rounded-lg mb-2">
                        <span className="font-semibold text-[#202020]">Overall Rating:</span>
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-[#F5C518] fill-current" />
                          <span
                            className="font-bold text-lg text-[#202020]"
                            data-testid={`overall-rating-${review.id}`}
                          >
                            {calculateOverallRating(review) ?? "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Response Time:</span>
                        {renderStars(review.ratingResponseTime)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Knowledge:</span>
                        {renderStars(review.ratingKnowledge)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Results:</span>
                        {renderStars(review.ratingResults)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Communication:</span>
                        {renderStars(review.ratingCommunication)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Availability:</span>
                        {renderStars(review.ratingAvailability)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-[#202020] mb-2">Review Text</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{review.comment}</p>
                </div>

                {review.proofUrl && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-[#202020] mb-2">Proof of Coaching</h4>
                    <div className="flex gap-2">
                      <a
                        href={review.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Proof
                      </a>
                      <a
                        href={review.proofUrl}
                        download
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
