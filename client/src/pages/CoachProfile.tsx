import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCoach } from "@/hooks/use-coaches";
import { Star, Share2, Flag, ArrowLeft, User, Mail, Phone, MessageCircle, AtSign, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ApprovedReview {
  id: number;
  coachName: string;
  ratingResponseTime: number | null;
  ratingKnowledge: number | null;
  ratingResults: number | null;
  ratingCommunication: number | null;
  ratingAvailability: number | null;
  communicationStyle: string | null;
  comment: string;
  proofUrl: string | null;
  authorName: string;
  createdAt: string | null;
}

export default function CoachProfile() {
  const params = useParams();
  const id = Number(params.id);
  const { data: coach, isLoading } = useCoach(id);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showSignInPopup, setShowSignInPopup] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);

  interface ContactInfo {
    signupEmail: string | null;
    reviewEmails: string[];
    reviewPhones: string[];
    reviewWhatsapps: string[];
    instagram: string | null;
  }

  const { data: contactInfo } = useQuery<ContactInfo>({
    queryKey: ["/api/coaches", id, "contact"],
    queryFn: async () => {
      const res = await fetch(`/api/coaches/${id}/contact`);
      if (!res.ok) throw new Error("Failed to fetch contact info");
      return res.json();
    },
    enabled: showContactDialog && !!id,
  });

  const { data: approvedReviews, isLoading: reviewsLoading } = useQuery<ApprovedReview[]>({
    queryKey: ["/api/reviews", coach?.name],
    queryFn: async () => {
      if (!coach?.name) return [];
      const res = await fetch(`/api/reviews/coach/${encodeURIComponent(coach.name)}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
    enabled: !!coach?.name,
  });

  const calculateAverageRating = (review: ApprovedReview) => {
    const ratings = [
      review.ratingResponseTime,
      review.ratingKnowledge,
      review.ratingResults,
      review.ratingCommunication,
      review.ratingAvailability,
    ].filter((r): r is number => r !== null);
    if (ratings.length === 0) return 0;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  };

  const formatRating = (rating: number): string => {
    return rating.toFixed(1);
  };

  // Calculate overall coach rating from all approved reviews
  // Formula: Sum of all category ratings / (Total feedbacks × 4)
  const calculateOverallCoachRating = (): { rating: string; count: number } => {
    if (!approvedReviews || approvedReviews.length === 0) {
      return { rating: "0.0", count: 0 };
    }
    
    let totalSum = 0;
    let totalRatings = 0;
    
    approvedReviews.forEach((review) => {
      if (review.ratingResponseTime !== null) {
        totalSum += review.ratingResponseTime;
        totalRatings++;
      }
      if (review.ratingKnowledge !== null) {
        totalSum += review.ratingKnowledge;
        totalRatings++;
      }
      if (review.ratingResults !== null) {
        totalSum += review.ratingResults;
        totalRatings++;
      }
      if (review.ratingCommunication !== null) {
        totalSum += review.ratingCommunication;
        totalRatings++;
      }
      if (review.ratingAvailability !== null) {
        totalSum += review.ratingAvailability;
        totalRatings++;
      }
    });
    
    if (totalRatings === 0) {
      return { rating: "0.0", count: approvedReviews.length };
    }
    
    const overallRating = totalSum / (approvedReviews.length * 5);
    return { 
      rating: overallRating.toFixed(1), 
      count: approvedReviews.length 
    };
  };

  const coachOverallRating = calculateOverallCoachRating();

  const getRatingDistribution = (): { star: number; count: number; percentage: number }[] => {
    if (!approvedReviews || approvedReviews.length === 0) {
      return [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, percentage: 0 }));
    }

    const buckets: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    approvedReviews.forEach((review) => {
      const avg = calculateAverageRating(review);
      if (avg >= 5.0) buckets[5]++;
      else if (avg >= 4.0) buckets[4]++;
      else if (avg >= 3.0) buckets[3]++;
      else if (avg >= 2.0) buckets[2]++;
      else buckets[1]++;
    });

    const total = approvedReviews.length;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: buckets[star],
      percentage: total > 0 ? Math.round((buckets[star] / total) * 100) : 0,
    }));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      return;
    }
    if (!user?.isAthlete) {
      toast({
        title: "Athletes Only",
        description: "Only athletes can submit reviews for coaches",
        variant: "destructive",
      });
      return;
    }
    navigate("/rate");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <h2 className="text-2xl font-bold text-[#202020] mb-2">Coach Not Found</h2>
          <p className="text-[#666666] mb-6">The coach you are looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <button className="btn-primary-yellow px-6 py-3 rounded-lg">Return Home</button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link href="/">
            <button className="flex items-center gap-2 text-[#666666] hover:text-[#202020] mb-6 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </button>
          </Link>

          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="h-2.5 bg-[#202020]"></div>
            
            <div className="px-8 py-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5">
                  {coach.imageUrl ? (
                    <img src={coach.imageUrl} alt={coach.name} className="w-full h-full object-cover rounded-lg bg-gray-100" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-grow pt-2 md:pt-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-extrabold text-[#202020] mb-2">{coach.name}</h1>
                      <div className="flex items-center gap-4 text-sm text-[#666666] mb-3">
                        <span className="font-medium text-[#333333]">
                          {coach.sport} Coach
                        </span>
                        {coach.instagram && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1">
                              @{coach.instagram.replace('@', '')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <div className="flex items-center gap-1 text-[#F5C518] justify-end">
                          <Star className="w-5 h-5 fill-current" />
                          <span className="text-2xl font-bold text-[#202020]" data-testid="coach-overall-rating">{coachOverallRating.rating}</span>
                        </div>
                        <p className="text-xs text-[#666666]" data-testid="coach-feedback-count">{coachOverallRating.count} {coachOverallRating.count === 1 ? 'feedback' : 'feedbacks'}</p>
                      </div>
                      
                      {isAuthenticated && user?.isAthlete ? (
                        <button 
                          onClick={handleWriteReview}
                          className="btn-primary-yellow px-6 py-3 rounded-lg text-sm font-bold shadow-lg shadow-yellow-500/10"
                          data-testid="button-write-review"
                        >
                          Write a Review
                        </button>
                      ) : !isAuthenticated ? (
                        <Popover open={showSignInPopup} onOpenChange={setShowSignInPopup}>
                          <PopoverTrigger asChild>
                            <button 
                              onClick={() => setShowSignInPopup(true)}
                              className="btn-primary-yellow px-6 py-3 rounded-lg text-sm font-bold shadow-lg shadow-yellow-500/10"
                              data-testid="button-write-review"
                            >
                              Write a Review
                            </button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-auto px-4 py-2 text-sm font-medium text-white border-0"
                            style={{ backgroundColor: '#8B4513' }}
                            sideOffset={8}
                          >
                            Please Sign-in to Rate your Coach
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <button 
                          onClick={handleWriteReview}
                          className="btn-primary-yellow px-6 py-3 rounded-lg text-sm font-bold shadow-lg shadow-yellow-500/10"
                          data-testid="button-write-review"
                        >
                          Write a Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About & Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-[#202020] mb-4">About Coach</h3>
                <p className="text-[#666666] leading-relaxed">
                  {coach.description || `Dedicated ${coach.sport} coach focused on helping athletes achieve their personal best.`}
                </p>
              </section>

              {/* Rating Distribution */}
              <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm" data-testid="rating-summary-section">
                <h3 className="text-xl font-bold text-[#202020] mb-6">Rating Distribution</h3>
                <div className="space-y-2">
                  {getRatingDistribution().map(({ star, count, percentage }) => (
                    <div key={star} className="flex items-center gap-3" data-testid={`distribution-row-${star}`}>
                      <span className="text-sm font-medium text-[#333333] w-14 shrink-0">{star} {star === 1 ? "Star" : "Stars"}</span>
                      <div className="flex-grow h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F5C518] rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                          data-testid={`distribution-bar-${star}`}
                        />
                      </div>
                      <span className="text-sm text-[#666666] w-8 text-right shrink-0" data-testid={`distribution-count-${star}`}>{count}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-[#202020] mb-6">
                  Reviews {approvedReviews && approvedReviews.length > 0 && `(${approvedReviews.length})`}
                </h3>
                {reviewsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : !approvedReviews || approvedReviews.length === 0 ? (
                  <p className="text-[#666666] text-center py-6">
                    No reviews yet. Be the first to rate this coach!
                  </p>
                ) : (
                  <div className="space-y-6">
                    {approvedReviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="pb-6 border-b border-gray-50 last:border-0 last:pb-0" data-testid={`review-${review.id}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-[#333333]">{review.authorName}</div>
                          <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#F5C518] mb-2 text-sm">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-4 h-4 ${star <= Math.round(calculateAverageRating(review)) ? "fill-current" : "text-gray-200"}`} 
                              />
                            ))}
                          </div>
                          <span className="font-bold text-[#202020]" data-testid={`review-rating-${review.id}`}>
                            {formatRating(calculateAverageRating(review))}
                          </span>
                        </div>
                        <p className="text-[#666666] text-sm leading-relaxed">
                          {review.comment}
                        </p>
                        {review.proofUrl && (
                          <div className="mt-4">
                            <a
                              href={review.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="inline-flex items-center gap-2 text-sm font-medium text-[#202020] hover:text-[#F5C518] transition-colors"
                              data-testid={`link-review-proof-${review.id}`}
                            >
                              <Download className="w-4 h-4" />
                              Download proof file
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {approvedReviews.length > 5 && (
                      <div className="pt-2">
                        <button className="text-[#F5C518] font-semibold text-sm hover:underline">
                          View all {approvedReviews.length} reviews
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
                {(() => {
                  const methods = new Set<string>();
                  approvedReviews?.forEach((review) => {
                    if (review.communicationStyle) {
                      review.communicationStyle.split(", ").forEach((m) => methods.add(m.trim()));
                    }
                  });
                  const contactMethods = Array.from(methods);
                  if (contactMethods.length === 0) return null;
                  return (
                    <>
                      <h3 className="font-bold text-[#202020] mb-4">How Athletes Contact This Coach</h3>
                      <ul className="space-y-3 mb-6">
                        {contactMethods.map((method, index) => (
                          <li key={index} className="flex items-center gap-3 text-sm text-[#666666]" data-testid={`text-contact-method-${index}`}>
                            <div className="w-2 h-2 rounded-full bg-[#F5C518]" />
                            {method}
                          </li>
                        ))}
                      </ul>
                      <hr className="my-6 border-gray-100" />
                    </>
                  );
                })()}

                <h3 className="font-bold text-[#202020] mb-4">Specialties</h3>
                <ul className="space-y-3">
                  {coach.specialties && coach.specialties.length > 0 ? (
                    coach.specialties.map((specialty: string, index: number) => (
                      <li key={index} className="flex items-center gap-3 text-sm text-[#666666]" data-testid={`text-specialty-${index}`}>
                        <div className="w-2 h-2 rounded-full bg-[#F5C518]" />
                        {specialty}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-[#999999]">No specialties listed</li>
                  )}
                </ul>
                
                <hr className="my-6 border-gray-100" />
                
                <button
                  className="w-full btn-secondary-dark py-3 rounded-lg font-bold mb-3"
                  onClick={() => setShowContactDialog(true)}
                  data-testid="button-contact-coach"
                >
                  Contact Coach
                </button>
                <button className="w-full btn-secondary-light py-3 rounded-lg font-bold">
                  Visit Website
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#202020]">
              Contact {coach?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#999999]">
              Available contact information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {contactInfo ? (
              <>
                {contactInfo.signupEmail && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-[#F5C518] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#999999] uppercase tracking-wide">Email</p>
                      <a href={`mailto:${contactInfo.signupEmail}`} className="text-sm text-[#202020] hover:text-[#F5C518] transition-colors" data-testid="text-signup-email">
                        {contactInfo.signupEmail}
                      </a>
                    </div>
                  </div>
                )}

                {contactInfo.reviewEmails.length > 0 && contactInfo.reviewEmails.map((email, i) => (
                  <div key={`re-${i}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-[#F5C518] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#999999] uppercase tracking-wide">Email (from review)</p>
                      <a href={`mailto:${email}`} className="text-sm text-[#202020] hover:text-[#F5C518] transition-colors" data-testid={`text-review-email-${i}`}>
                        {email}
                      </a>
                    </div>
                  </div>
                ))}

                {contactInfo.reviewPhones.length > 0 && contactInfo.reviewPhones.map((phone, i) => (
                  <div key={`rp-${i}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-[#F5C518] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#999999] uppercase tracking-wide">Phone</p>
                      <a href={`tel:${phone}`} className="text-sm text-[#202020] hover:text-[#F5C518] transition-colors" data-testid={`text-review-phone-${i}`}>
                        {phone}
                      </a>
                    </div>
                  </div>
                ))}

                {contactInfo.reviewWhatsapps.length > 0 && contactInfo.reviewWhatsapps.map((whatsapp, i) => (
                  <div key={`rw-${i}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-[#25D366] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#999999] uppercase tracking-wide">WhatsApp</p>
                      <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#202020] hover:text-[#25D366] transition-colors" data-testid={`text-review-whatsapp-${i}`}>
                        {whatsapp}
                      </a>
                    </div>
                  </div>
                ))}

                {contactInfo.instagram && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <AtSign className="w-5 h-5 text-[#E1306C] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#999999] uppercase tracking-wide">Instagram</p>
                      <a href={`https://instagram.com/${contactInfo.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#202020] hover:text-[#E1306C] transition-colors" data-testid="text-instagram">
                        @{contactInfo.instagram.replace('@', '')}
                      </a>
                    </div>
                  </div>
                )}

                {!contactInfo.signupEmail && contactInfo.reviewEmails.length === 0 && contactInfo.reviewPhones.length === 0 && contactInfo.reviewWhatsapps.length === 0 && !contactInfo.instagram && (
                  <p className="text-sm text-[#999999] text-center py-4">No contact information available for this coach.</p>
                )}
              </>
            ) : (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
