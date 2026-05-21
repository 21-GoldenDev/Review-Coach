import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Star, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@/hooks/use-upload";
import { SignInDialog } from "@/components/SignInDialog";
import type { Coach } from "@shared/schema";

const contactMethods = [
  "Email",
  "Text",
  "WhatsApp",
  "Facetime",
  "Mobile App",
  "Form"
];

export default function RateCoach() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [requiresReauth, setRequiresReauth] = useState(false);
  
  const [coachName, setCoachName] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [coachInstagram, setCoachInstagram] = useState("");
  const [coachingPlatform, setCoachingPlatform] = useState("");
  
  const [responseTime, setResponseTime] = useState(0);
  const [knowledge, setKnowledge] = useState(0);
  const [results, setResults] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [availability, setAvailability] = useState(0);
  
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [writtenReview, setWrittenReview] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setUploadedProofUrl(response.objectPath);
    },
    subdir: "review_doc",
  });

  const { data: allCoaches = [] } = useQuery<Coach[]>({
    queryKey: ["/api/coaches"],
  });

  const filteredCoaches = coachName.trim().length >= 1 && !selectedCoachId
    ? allCoaches.filter((c) =>
        c.name.toLowerCase().includes(coachName.trim().toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCoachNameChange = (value: string) => {
    setCoachName(value);
    setSelectedCoachId(null);
    setShowSuggestions(true);
  };

  const handleSelectCoach = (coach: Coach) => {
    setCoachName(coach.name);
    setSelectedCoachId(coach.id);
    setShowSuggestions(false);
    setCoachInstagram("");
  };

  const isExistingCoach = selectedCoachId !== null;

  const submitReviewMutation = useMutation({
    mutationFn: async (data: {
      coachName: string;
      coachInstagram?: string;
      coachingPlatform?: string;
      ratingResponseTime?: number;
      ratingKnowledge?: number;
      ratingResults?: number;
      ratingCommunication?: number;
      ratingAvailability?: number;
      communicationStyle?: string;
      comment: string;
      proofUrl?: string;
    }) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Thank you! Your review is pending admin approval. To submit another review, you'll need to verify your identity again.",
        className: "bg-green-50 border-green-200 text-green-900",
      });
      resetForm();
      setRequiresReauth(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCoachName("");
    setSelectedCoachId(null);
    setCoachInstagram("");
    setCoachingPlatform("");
    setResponseTime(0);
    setKnowledge(0);
    setResults(0);
    setCommunication(0);
    setAvailability(0);
    setSelectedStyles([]);
    setWrittenReview("");
    setProofFile(null);
    setUploadedProofUrl(null);
    setErrors({});
  };

  const handleStyleToggle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (validTypes.includes(file.type)) {
        setProofFile(file);
        setErrors(prev => ({ ...prev, proofFile: "" }));
        const result = await uploadFile(file);
        if (result) {
          setUploadedProofUrl(result.objectPath);
        }
      } else {
        setErrors(prev => ({ ...prev, proofFile: "Please upload a PDF, JPG, PNG, or WEBP file" }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!coachName.trim()) {
      newErrors.coachName = "Coach name is required";
    }
    if (!writtenReview.trim()) {
      newErrors.writtenReview = "Please write your review";
    }
    if (!proofFile) {
      newErrors.proofFile = "Proof of coaching is required";
    }
    if (proofFile && !uploadedProofUrl) {
      newErrors.proofFile = "Please wait for file upload to complete";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || requiresReauth) {
      setShowSignInDialog(true);
      return;
    }

    if (!user.isAthlete) {
      toast({
        title: "Athletes Only",
        description: "Only athletes can submit reviews.",
        variant: "destructive",
      });
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    submitReviewMutation.mutate({
      coachName,
      coachInstagram: coachInstagram || undefined,
      coachingPlatform: coachingPlatform || undefined,
      ratingResponseTime: responseTime || undefined,
      ratingKnowledge: knowledge || undefined,
      ratingResults: results || undefined,
      ratingCommunication: communication || undefined,
      ratingAvailability: availability || undefined,
      communicationStyle: selectedStyles.length > 0 ? selectedStyles.join(", ") : undefined,
      comment: writtenReview,
      proofUrl: uploadedProofUrl || undefined,
    });
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (val: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#333333]">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-0.5 transition-transform hover:scale-110 ${
              value >= star ? "text-[#F5C518]" : "text-gray-300"
            }`}
            data-testid={`star-${label.toLowerCase().replace(/\s+/g, '-')}-${star}`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#202020] mb-2">Rate Your Coach</h1>
            <p className="text-[#666666]">Share your experience to help other athletes make informed decisions.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-5">
                    <h2 className="text-lg font-bold text-[#202020] border-b border-gray-100 pb-3">
                      Coach Information
                    </h2>
                    
                    <div className="relative">
                      <label className="block text-sm font-medium text-[#333333] mb-1">
                        Coach Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={inputRef}
                        type="text"
                        value={coachName}
                        onChange={(e) => handleCoachNameChange(e.target.value)}
                        onFocus={() => { if (coachName.trim() && !selectedCoachId) setShowSuggestions(true); }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none"
                        placeholder="Start typing coach's name..."
                        autoComplete="off"
                        data-testid="input-coach-name"
                      />
                      {showSuggestions && filteredCoaches.length > 0 && (
                        <div
                          ref={suggestionsRef}
                          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
                          data-testid="coach-suggestions-dropdown"
                        >
                          {filteredCoaches.map((coach) => (
                            <button
                              key={coach.id}
                              type="button"
                              onClick={() => handleSelectCoach(coach)}
                              className="w-full px-3 py-2 text-left text-sm text-[#333333] hover:bg-[#F5C518]/10 flex items-center gap-2 transition-colors"
                              data-testid={`suggestion-coach-${coach.id}`}
                            >
                              <span className="font-medium">{coach.name}</span>
                              {coach.sport && (
                                <span className="text-xs text-[#666666]">({coach.sport})</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {isExistingCoach && (
                        <p className="text-xs text-green-600 mt-1" data-testid="text-coach-registered">
                          This coach is already registered on the platform.
                        </p>
                      )}
                      {errors.coachName && <p className="text-red-500 text-sm mt-1">{errors.coachName}</p>}
                    </div>

                    {!isExistingCoach && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-[#333333] mb-1">
                            Coach Instagram
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                            <input
                              type="text"
                              value={coachInstagram}
                              onChange={(e) => setCoachInstagram(e.target.value.replace(/^@/, ''))}
                              className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none"
                              placeholder="username"
                              data-testid="input-coach-instagram"
                            />
                          </div>
                        </div>

                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[#333333] mb-1">
                        Coaching Platform
                      </label>
                      <input
                        type="text"
                        value={coachingPlatform}
                        onChange={(e) => setCoachingPlatform(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none"
                        placeholder="Google Form, WhatsApp, Trainerize, Website URL"
                        data-testid="input-coaching-platform"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-5">
                    <h2 className="text-lg font-bold text-[#202020] border-b border-gray-100 pb-3">
                      Ratings & Evaluation
                    </h2>
                    
                    <StarRating value={responseTime} onChange={setResponseTime} label="Response Time" />
                    <StarRating value={knowledge} onChange={setKnowledge} label="Knowledge of Coach" />
                    <StarRating value={results} onChange={setResults} label="Results With You" />
                    <StarRating value={communication} onChange={setCommunication} label="Communication Level" />
                    <StarRating value={availability} onChange={setAvailability} label="Availability" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-lg font-bold text-[#202020] border-b border-gray-100 pb-3">
                      How the Coach Communicates
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {contactMethods.map((method) => (
                        <div key={method} className="flex items-center space-x-2">
                          <Checkbox
                            id={method}
                            checked={selectedStyles.includes(method)}
                            onCheckedChange={() => handleStyleToggle(method)}
                            data-testid={`checkbox-contact-${method.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <label
                            htmlFor={method}
                            className="text-sm text-[#333333] cursor-pointer"
                          >
                            {method}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-lg font-bold text-[#202020] border-b border-gray-100 pb-3">
                      Proof of Coaching <span className="text-red-500">*</span>
                    </h2>
                    
                    <div>
                      <label 
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#F5C518] hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-[#666666]">
                            {proofFile ? proofFile.name : "Upload your receipt, transaction document with Coach"}
                          </p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={handleFileChange}
                          data-testid="input-proof-file"
                        />
                      </label>
                      <p className="text-xs text-[#666666] mt-2">
                        Upload any statement, receipt, invoice, or proof of coaching. This will only be visible to the admin for verification purposes and will not be shown publicly.
                      </p>
                      {errors.proofFile && <p className="text-red-500 text-sm mt-1">{errors.proofFile}</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="h-fit lg:sticky lg:top-8">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-lg font-bold text-[#202020] border-b border-gray-100 pb-3">
                      Written Review <span className="text-red-500">*</span>
                    </h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#333333] mb-2">
                        In your own words, describe your personal experience with this coach — both good and bad.
                      </label>
                      <textarea
                        value={writtenReview}
                        onChange={(e) => setWrittenReview(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#F5C518] focus:border-transparent outline-none resize-none"
                        rows={16}
                        placeholder="Share your honest experience..."
                        data-testid="textarea-written-review"
                      />
                      {errors.writtenReview && <p className="text-red-500 text-sm mt-1">{errors.writtenReview}</p>}
                    </div>

                    <Button 
                      type="submit"
                      disabled={submitReviewMutation.isPending || isUploading}
                      className="w-full bg-[#F5C518] text-[#111111] font-bold py-3 border-[#F5C518]"
                      data-testid="button-submit-review"
                    >
                      {isUploading ? "Uploading..." : submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>

      <SignInDialog 
        open={showSignInDialog} 
        onOpenChange={setShowSignInDialog}
        redirectTo="/rate-coach"
        onSuccess={() => setRequiresReauth(false)}
      />

      <Footer />
    </div>
  );
}
