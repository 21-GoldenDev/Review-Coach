import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Download, ExternalLink, Star, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface PaginatedResponse {
  reviews: PendingReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

function ReviewCard({
  review,
  actions,
}: {
  review: PendingReview;
  actions?: React.ReactNode;
}) {
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

  const calculateOverallRating = (r: PendingReview): string | null => {
    const ratings = [
      r.ratingResponseTime,
      r.ratingKnowledge,
      r.ratingResults,
      r.ratingCommunication,
      r.ratingAvailability,
    ].filter((val): val is number => val != null);
    if (ratings.length === 0) return null;
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return avg.toFixed(1);
  };

  return (
    <Card className="overflow-hidden">
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
          {actions && <div className="flex gap-2">{actions}</div>}
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
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-gray-500">
        {total} review{total !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {start > 1 && (
          <>
            <Button variant="outline" size="sm" onClick={() => onPageChange(1)}>1</Button>
            {start > 2 && <span className="px-1 text-gray-400">...</span>}
          </>
        )}
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
            className={p === page ? "bg-[#F5C518] text-[#202020] hover:bg-[#e0b014]" : ""}
          >
            {p}
          </Button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}
            <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)}>{totalPages}</Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function ReviewList({
  data,
  isLoading,
  emptyMessage,
  renderActions,
  page,
  onPageChange,
}: {
  data: PaginatedResponse | undefined;
  isLoading: boolean;
  emptyMessage: string;
  renderActions: (review: PendingReview) => React.ReactNode;
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.reviews?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {data.reviews.map((review) => (
          <ReviewCard key={review.id} review={review} actions={renderActions(review)} />
        ))}
      </div>
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        onPageChange={onPageChange}
      />
    </div>
  );
}

export function AdminReviewsPanel() {
  const { toast } = useToast();
  const [subtab, setSubtab] = useState("pending");
  const [page, setPage] = useState(1);

  const handleSubtabChange = (value: string) => {
    setSubtab(value);
    setPage(1);
  };

  const pendingQuery = useQuery<PaginatedResponse>({
    queryKey: ["/api/admin/reviews", { page }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reviews?page=${page}&limit=10`, { credentials: "include" });
      if (!res.ok) {
        let message = "Failed to fetch reviews";
        if (res.status === 404) {
          message = "Reviews API not found. Restart or redeploy the server.";
        }
        throw new Error(message);
      }
      return parseApiJson<PaginatedResponse>(res);
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const publishedQuery = useQuery<PaginatedResponse>({
    queryKey: ["/api/admin/reviews/approved", { page }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reviews/approved?page=${page}&limit=10`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch published reviews");
      return parseApiJson<PaginatedResponse>(res);
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const rejectedQuery = useQuery<PaginatedResponse>({
    queryKey: ["/api/admin/reviews/rejected", { page }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reviews/rejected?page=${page}&limit=10`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch rejected reviews");
      return parseApiJson<PaginatedResponse>(res);
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews/approved"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews/rejected"] });
  };

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/reviews/${id}/approve`);
    },
    onSuccess: () => {
      invalidateAll();
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
      invalidateAll();
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

  const unpublishMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/reviews/${id}/unpublish`);
    },
    onSuccess: () => {
      invalidateAll();
      toast({
        title: "Review Unpublished",
        description: "The review has been moved back to pending.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unpublish review",
        variant: "destructive",
      });
    },
  });

  const isMutating = approveMutation.isPending || rejectMutation.isPending || unpublishMutation.isPending;

  return (
    <div>
      <Tabs value={subtab} onValueChange={handleSubtabChange} className="w-full">
        <TabsList className="mb-6 bg-white border h-11 p-1">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-[#F5C518] data-[state=active]:text-[#202020] gap-2"
          >
            <Clock className="w-4 h-4" />
            Pending ({pendingQuery.data?.total ?? 0})
          </TabsTrigger>
          <TabsTrigger
            value="published"
            className="data-[state=active]:bg-[#F5C518] data-[state=active]:text-[#202020] gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Published ({publishedQuery.data?.total ?? 0})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:bg-[#F5C518] data-[state=active]:text-[#202020] gap-2"
          >
            <XCircle className="w-4 h-4" />
            Rejected ({rejectedQuery.data?.total ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <ReviewList
            data={pendingQuery.data}
            isLoading={pendingQuery.isLoading}
            emptyMessage="No pending reviews to moderate."
            page={page}
            onPageChange={setPage}
            renderActions={(review) => (
              <>
                <Button
                  onClick={() => approveMutation.mutate(review.id)}
                  disabled={isMutating}
                  className="bg-green-600 text-white"
                  data-testid={`button-approve-${review.id}`}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  onClick={() => rejectMutation.mutate(review.id)}
                  disabled={isMutating}
                  variant="destructive"
                  data-testid={`button-reject-${review.id}`}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
          />
        </TabsContent>

        <TabsContent value="published">
          <ReviewList
            data={publishedQuery.data}
            isLoading={publishedQuery.isLoading}
            emptyMessage="No published reviews yet."
            page={page}
            onPageChange={setPage}
            renderActions={(review) => (
              <Button
                onClick={() => unpublishMutation.mutate(review.id)}
                disabled={isMutating}
                variant="destructive"
              >
                <X className="w-4 h-4 mr-1" />
                Unpublish
              </Button>
            )}
          />
        </TabsContent>

        <TabsContent value="rejected">
          <ReviewList
            data={rejectedQuery.data}
            isLoading={rejectedQuery.isLoading}
            emptyMessage="No rejected reviews."
            page={page}
            onPageChange={setPage}
            renderActions={(review) => (
              <Button
                onClick={() => approveMutation.mutate(review.id)}
                disabled={isMutating}
                className="bg-green-600 text-white"
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}