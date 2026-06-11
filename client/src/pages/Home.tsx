import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { SearchHero } from "@/components/SearchHero";
import { Footer } from "@/components/Footer";
import { CoachCard } from "@/components/CoachCard";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquare, Download, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CoachWithRating {
  id: number;
  name: string;
  sport: string;
  instagram: string | null;
  imageUrl: string | null;
  calculatedRating: string;
  feedbackCount: number;
}

interface RecentReview {
  id: number;
  coachId: number | null;
  coachName: string;
  coachInstagram: string | null;
  coachEmail: string | null;
  coachPhone: string | null;
  coachWhatsapp: string | null;
  communicationStyle: string | null;
  authorName: string;
  comment: string;
  overallRating: string;
  ratingResponseTime: number | null;
  ratingKnowledge: number | null;
  ratingResults: number | null;
  ratingCommunication: number | null;
  ratingAvailability: number | null;
  proofUrl: string | null;
  createdAt: string | null;
}

const COACHES_PER_PAGE = 4;

function ReviewDetailDialog({
  review,
  open,
  onOpenChange,
}: {
  review: RecentReview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!review) return null;

  const renderStars = (rating: number | null) => {
    if (rating === null) return <span className="text-gray-400">N/A</span>;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "text-[#F5C518]" : "text-gray-200"}`}
            style={{ fill: star <= rating ? "#F5C518" : "#E5E7EB" }}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Review from {review.authorName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-3 bg-[#F5C518]/10 p-4 rounded-lg">
            <Star className="w-6 h-6 text-[#F5C518]" style={{ fill: "#F5C518" }} />
            <div>
              <span className="text-2xl font-bold text-[#202020]">{review.overallRating}</span>
              <span className="text-gray-500 text-sm ml-2">overall rating</span>
            </div>
            <span className="text-sm text-gray-400 ml-auto">
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
            </span>
          </div>

          <div>
            <h4 className="font-semibold text-[#202020] mb-2">Coach</h4>
            <Link
              href={review.coachId ? `/coach/${review.coachId}` : "#"}
              className="text-[#F5C518] font-medium hover:underline"
              onClick={() => onOpenChange(false)}
            >
              {review.coachName}
            </Link>
            {review.communicationStyle && (
              <p className="text-sm text-gray-500 mt-1">Contact: {review.communicationStyle}</p>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-[#202020] mb-2">Review</h4>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-line">{review.comment}</p>
          </div>

          <div>
            <h4 className="font-semibold text-[#202020] mb-3">Ratings</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Response Time</span>
                {renderStars(review.ratingResponseTime)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Knowledge</span>
                {renderStars(review.ratingKnowledge)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Results</span>
                {renderStars(review.ratingResults)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Communication</span>
                {renderStars(review.ratingCommunication)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Availability</span>
                {renderStars(review.ratingAvailability)}
              </div>
            </div>
          </div>

          {review.proofUrl && (
            <div className="flex gap-3 pt-2">
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
                Download Proof
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const [visibleCount, setVisibleCount] = useState(COACHES_PER_PAGE);
  const [selectedReview, setSelectedReview] = useState<RecentReview | null>(null);
  const isLoadingMore = useRef(false);
  const hasMoreRef = useRef(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data: coaches, isLoading } = useQuery<CoachWithRating[]>({
    queryKey: ["/api/featured-coaches"],
  });

  const { data: recentReviews } = useQuery<RecentReview[]>({
    queryKey: ["/api/reviews/recent"],
  });

  const allCoaches = coaches || [];
  const displayCoaches = allCoaches.slice(0, visibleCount);
  const hasMore = visibleCount < allCoaches.length;
  hasMoreRef.current = hasMore;

  useEffect(() => {
    isLoadingMore.current = false;
  }, [visibleCount]);

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  const sentinelCallbackRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !isLoadingMore.current) {
          isLoadingMore.current = true;
          setVisibleCount((prev) => prev + COACHES_PER_PAGE);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow">
        <SearchHero />

        {/* Recent Reviews */}
        {recentReviews && recentReviews.length > 0 && (
          <section className="py-16 md:py-20 bg-gray-50 border-t border-gray-100">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="mb-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#202020] mb-2">
                  Recent Reviews
                </h2>
                <p className="text-[#666666]">What athletes are saying about their coaches</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentReviews.map((review) => (
                  <button
                    key={review.id}
                    onClick={() => setSelectedReview(review)}
                    className="block w-full text-left group"
                  >
                    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-[#F5C518] hover:shadow-md transition-all h-full">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 text-[#F5C518]">
                          <Star className="w-5 h-5" style={{ fill: "#F5C518" }} />
                          <span className="font-bold text-[#202020] text-lg">{review.overallRating}</span>
                        </div>
                        <span className="text-sm text-gray-400">· {timeAgo(review.createdAt)}</span>
                      </div>
                      <p className="text-[#666666] text-sm leading-relaxed line-clamp-3 mb-4">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-semibold text-[#202020] group-hover:text-[#F5C518] transition-colors">
                            {review.coachName}
                          </span>
                          <span className="text-gray-400 mx-1">·</span>
                          <span className="text-gray-500">{review.authorName}</span>
                        </div>
                        <MessageSquare className="w-4 h-4 text-gray-300 group-hover:text-[#F5C518] transition-colors" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <ReviewDetailDialog
          review={selectedReview}
          open={!!selectedReview}
          onOpenChange={(open) => {
            if (!open) setSelectedReview(null);
          }}
        />

        {/* Featured Coaches */}
        <section className="py-16 md:py-24 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#202020] mb-2">
                Featured Coaches
              </h2>
              <p className="text-[#666666]">Coaches selected by our team</p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-80 bg-gray-50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : displayCoaches.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  {displayCoaches.map((coach: any) => (
                    <CoachCard key={coach.id} coach={coach} />
                  ))}
                </div>
                {hasMore ? (
                  <div ref={sentinelCallbackRef} className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#F5C518] animate-spin" />
                  </div>
                ) : allCoaches.length > COACHES_PER_PAGE ? (
                  <p className="text-center text-sm text-gray-400 pt-6">
                    All {allCoaches.length} coaches loaded
                  </p>
                ) : null}
              </>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[#666666] text-lg">
                  No featured coaches yet. Check back soon!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[#202020] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
              Are you a Coach?
            </h2>
            <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
              Claim your profile today to start gathering reviews and growing
              your business. Join thousands of coaches who use our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  className="px-8 py-4 bg-[#F5C518] text-[#111111] font-bold text-lg"
                  data-testid="button-claim-profile"
                >
                  Claim Profile
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
