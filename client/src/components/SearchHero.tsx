import { Search, Star, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CoachWithRating {
  id: number;
  name: string;
  sport: string;
  instagram: string | null;
  imageUrl: string | null;
  calculatedRating: string;
  feedbackCount: number;
}

export function SearchHero() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isAdvertiseOpen, setIsAdvertiseOpen] = useState(false);
  const [advertiseEmail, setAdvertiseEmail] = useState("");
  const [advertiseBody, setAdvertiseBody] = useState("");
  const [isAdvertiseSending, setIsAdvertiseSending] = useState(false);

  const { data: stats } = useQuery<{
    coachCount: number;
    athleteCount: number;
  }>({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: searchResults, isLoading } = useQuery<CoachWithRating[]>({
    queryKey: ["/api/coaches-with-ratings", searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      const res = await fetch(
        `/api/coaches-with-ratings?search=${encodeURIComponent(searchTerm)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch coaches");
      return res.json();
    },
    enabled: searchTerm.trim().length > 0,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchTerm]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setShowResults(false);
  };

  const handleSendAdvertise = async () => {
    const subject = "I want to show ad";
    setIsAdvertiseSending(true);
    try {
      await apiRequest("POST", "/api/advertise", {
        fromEmail: advertiseEmail,
        subject,
        body: advertiseBody,
      });

      toast({
        title: "Message sent!",
        description: "We received your advertising request.",
      });

      setAdvertiseEmail("");
      setAdvertiseBody("");
      setIsAdvertiseOpen(false);
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsAdvertiseSending(false);
    }
  };

  return (
    <div className="relative py-16 md:py-24 lg:py-32 bg-[#F9F9F9] border-b border-black/5 overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-bl from-yellow-500/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/4 h-2/3 bg-gradient-to-tr from-gray-200/40 to-transparent pointer-events-none rounded-tr-[100px]" />
      {/* LEFT NATIVE AD */}
      <div className="hidden xl:flex absolute left-4 top-0 h-full w-[14.285%] items-center justify-center z-0">
        <div className="relative w-full h-full flex items-center justify-center">
          <a
            href="https://www.hga.com"
            target="_blank"
            rel="noreferrer"
            className="w-full h-full flex items-center justify-center"
          >
            <img
              src="/ads/left-ad.jpg"
              className="w-full h-[500px] object-cover opacity-40 hover:opacity-70 transition rounded-lg"
            />
          </a>
          <button
            type="button"
            onClick={() => setIsAdvertiseOpen(true)}
            className="w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            aria-label="Advertise with us"
          >
            <span className="bg-white/90 text-[#202020] font-bold px-4 py-2 rounded-full shadow-sm border border-gray-200 hover:bg-white transition">
              Advertise with us
            </span>
          </button>
        </div>
      </div>

      {/* RIGHT NATIVE AD */}
      <div className="hidden xl:flex absolute right-4 top-0 h-full w-[14.285%] items-center justify-center z-0">
        <div className="relative w-full h-full flex items-center justify-center">
          <a
            href="https://adclick.g.doubleclick.net/pcs/click?xai=AKAOjss2znza5TEdkpVGpcT8k9k2KcRTS4-Kz-gHdIk3IvrV1fI7kVeuhY6UHsYh49pD7NsrMYfmbhM9Pd_0bU-jGTvjn2CSkJdDQYgaWpiECkhTj16zlHdXNa9pQNrTKJqG1odeUocKAIfLA3JPn9tHJfJlARjNk27PYHGziqrfheptWaSvWEa2QYEsMA-aFi7QYYJC2YkXxtCIyKdfXUD7yb-CI_ZywyUJd9UJLtWGha-Sfg4AlzhlbvW1bcsT66BSseTGljyfhvefvOiRpbKE4bDikPBbsfxP2gZ-ES1UGwPWUDujMabCjd3ltkvPmLYExBkXAY8-yMfg9MNz3cPJHa4ocy81iWzN58g6So9g4GeUPMAep2bW_oUIS7TzRL7kZI6mQJ_cY8GRNnmknqGR0LxdHAdibbP-WAITvhl8T0Da-FBWh5xYLpCM0kjr-jlg1brIykcpG7bde8bnIesilB1NfPvWlioLJbEq2MKZUhAG&sai=AMfl-YSxx27gSit6U9r0wJb5g0LD_BuckwSjsWKOSa3xq5KbvhVZ9vmfFdYLxLCCwGR1-CZuLEPSZY8FcUxadevopVIvSSb62ZojKxfr_NH0kNgonkUEpriggEUQLT9Yrifuv4HRMcKpqobRFVEaaD3s2In6OC9Ii-8fTaWFWIRYKHysFYLB_ROp6Ynp-jXSny44pP6oZrPycrs6pTI35jWaIOLk0Ps3wBJ23LovwT_PX8SHrBXXWkKhVhnsk8S910tZhbylT6BszModD-iPKoF1RDqrRF7uMZ9GXeckSAit2i3e8Bh39TBjegSd&sig=Cg0ArKJSzORUNUDqSqxY&cry=1&fbs_aeid=%5Bgw_fbsaeid%5D&urlfix=1&nx=48&ny=79&dim=160x600&adurl=https://insight.adsrvr.org/track/clk%3Fimp%3Dbf8c5020-1056-4402-b7cb-de9466a4ccd2%26ag%3Daitx2xl%26sfe%3D1c0abe4b%26sig%3DXTtNp9kEti4jFbOtMkOIjaBTZAhH0CB4CvLpwa7_nZs.%26crid%3Dlc2iwp5k%26cf%3D10025949%26fq%3D0%26t%3D1%26td_s%3Dwww.truepeoplesearch.com%26rcats%3D5rf,jba,hhr%26mste%3D%26mfld%3D2%26mssi%3D%26mfsi%3D%26sv%3Dezoic%26uhow%3D25%26agsa%3D%26wp%3D1.2551085%26rgz%3D10003%26dt%3DPC%26osf%3DWindows%26os%3DWindows10%26br%3DChrome%26svpid%3Dfa31fb1e60b1b5df81188f9bdffc8be8%26rlangs%3Den%26mlang%3Den%26did%3D%26rcxt%3DOther%26tmpc%3D9.050000000000011%26vrtd%3D%26osi%3D%26osv%3D%26daid%3D%26dnr%3D0%26vpb%3D%26crrelr%3D%26npt%3D%26cc%3D2~KLUv_WMdqREMzgKtEQBTVExREdpERFiLiqCGi_ACl1N0yymKygnC5dqicmuicmxROS5Sua4U1csF5wkAYI2rj7Kplw4EzqoLUmqIKRAkBZMumKvurQvG2cvKLBfHJmcHEUMNqERJaWEV-zCKkYatxQGEsgAAaUsRMC_Qj9UdPTCmbKgQp6zLRd5jTXwCk2bF9grTUBuWaVym4jJNvdK4VvqBt_83Dsu8jvdwfcv-Dfs0HPOyzr993X_X_i3LsFaYSn9QaILxRpBVA96HZZmncbnf5z-W57oEDEWX5LSxwqXnlUW2wASGAMYmfbGzzip2Eo6t6T-1ep37O87_OB7H-A7Hs_5nKUBx68IBXKlYX2q8SWvW0uxSLpTpj1eDMnkmCZ1aWWtd6lU8Om-S_DsAudny-nBXY2NmeGXd_F7r-DqWA0n8MLhZ2CoFADbheOMRT5jpTsZJIsZl-6C76oW9ra0ROVDAELgA5CuFgKSt_AMg7ypN9kDVqgy0s8b8prhrezif572WwZDpwhL4esI_pKTsjHag30v7DXvj_W5M_Q0n9KQ1GONz_RXaV_sfiC9uHMK3M0Ucvgg8H8EHKts8mCa50kbmLCepX4s1HAOZelS_oTY-Ii6xGKpcYPtdEFA5ZRh1CnM24XcMLLfzjbxkbaSa1UznAOXx4GVwI9OX8B86JjwZU1C1SI8bH0RGilMbH0hyA8nisodFzQXubWbLVtThUWv8Ef6p3WyNzKDnhN7oApTjV7Jp6yYoQMLBOMB_hZ4H%26dur%3D1~KLUv_WMFoCgkrwAFAwCDBA9LvKiAKrCDUwc-qguosJTAASsEyOH5t53OutfaYb8Rw05nCn-3GG5u6_91VyEDJRs8yjE9LeHpoTLNAgEL_P4WmuG--Xrig_vIfyb6q0OfD9wgpEDT-Yk6_mAJzz0.%26durs%3DTV0W1T%26bdc%3D10%26mk%3DMicrosoft%26mdl%3DWindows%2520PC%26testid%3Diavc1%2520%26fpa%3D252%26pcm%3D3%26ict%3DCellularNetwork3G%26said%3D0227e57f-ef23-414a-9e7e-2c1045df89e0%26auct%3D1%26tail%3D1%26r%3Dhttps://brainhealthmatters.lilly.com/doctor-consultation%253Futm_source%253D6134386%2526utm_medium%253Ddisplay%2526utm_content%253Dpp-ad-us-0894%2526utm_campaign%253D34767620%2526utm_term%253D435897212%2526co%253Dna%2526au%253Dna%2526dclid%253D%2525edclid!%2526gad_source%253D7%2526gad_campaignid%253D23355783346"
            target="_blank"
            rel="noreferrer"
            className="w-full h-full flex items-center justify-center"
          >
            <img
              src="/ads/right-ad.jpg"
              className="w-full h-[500px] object-cover opacity-40 hover:opacity-70 transition rounded-lg"
            />
          </a>
          <button
            type="button"
            onClick={() => setIsAdvertiseOpen(true)}
            className="w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            aria-label="Advertise with us"
          >
            <span className="bg-white/90 text-[#202020] font-bold px-4 py-2 rounded-full shadow-sm border border-gray-200 hover:bg-white transition">
              Advertise with us
            </span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#202020] tracking-tight mb-4"
        >
          Rate My Coach
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-lg md:text-xl text-[#666666] mb-10 max-w-2xl font-medium"
        >
          Read real, honest reviews from athletes before you commit. Find the
          perfect mentor for your journey.
        </motion.p>

        <motion.div
          ref={searchRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full max-w-2xl relative"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search by coach name"
              className="w-full h-14 pl-12 pr-12 rounded-full border border-gray-200 shadow-sm 
                       focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 
                       text-lg transition-all duration-200 placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.trim() && setShowResults(true)}
              data-testid="input-search"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
                data-testid="button-clear-search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                data-testid="search-results-dropdown"
              >
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                    Searching...
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map((coach) => (
                      <Link
                        key={coach.id}
                        href={`/coach/${coach.id}`}
                        onClick={() => setShowResults(false)}
                      >
                        <div
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-b-0"
                          data-testid={`search-result-${coach.id}`}
                        >
                          <Avatar className="h-12 w-12 border border-gray-200">
                            <AvatarImage
                              src={coach.imageUrl || undefined}
                              alt={coach.name}
                            />
                            <AvatarFallback className="bg-[#F5C518] text-[#202020] font-bold">
                              {getInitials(coach.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <h4 className="font-bold text-[#202020]">
                              {coach.name}
                            </h4>
                            {coach.instagram && (
                              <p className="text-sm text-[#666666]">
                                @{coach.instagram}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-right">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-[#F5C518] text-[#F5C518]" />
                              <span className="font-bold text-[#333333]">
                                {coach.calculatedRating}
                              </span>
                            </div>
                            <span className="text-sm text-[#666666]">
                              {coach.feedbackCount}{" "}
                              {coach.feedbackCount === 1 ? "review" : "reviews"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 mb-1">No coaches found</p>
                    <p className="text-sm text-gray-400">
                      Try a different search term
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <Dialog open={isAdvertiseOpen} onOpenChange={setIsAdvertiseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Advertise with us</DialogTitle>
              <DialogDescription>
                Send us your ad inquiry and we will get back to you.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Email</label>
                <Input
                  type="email"
                  value={advertiseEmail}
                  onChange={(e) => setAdvertiseEmail(e.target.value)}
                  placeholder="you@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input type="text" value="I want to show ad" disabled />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={advertiseBody}
                  onChange={(e) => setAdvertiseBody(e.target.value)}
                  placeholder="Tell us what you want to advertise, budget, duration, and any links/assets."
                  className="min-h-[140px] resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdvertiseOpen(false)}
                disabled={isAdvertiseSending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[#F5C518] text-[#111111] font-bold"
                onClick={handleSendAdvertise}
                disabled={
                  isAdvertiseSending ||
                  !advertiseEmail.trim() ||
                  !advertiseBody.trim()
                }
              >
                {isAdvertiseSending ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 flex items-center gap-4 text-sm font-semibold text-[#333333] bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100"
          data-testid="stats-ticker"
        >
          <div className="flex items-center gap-2">
            <span
              className="text-[#F5C518] font-extrabold text-lg"
              data-testid="stats-coach-count"
            >
              {stats?.coachCount ?? 0}
            </span>
            <span>Coaches</span>
          </div>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span
              className="text-[#F5C518] font-extrabold text-lg"
              data-testid="stats-athlete-count"
            >
              {stats?.athleteCount ?? 0}
            </span>
            <span>Athletes</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
