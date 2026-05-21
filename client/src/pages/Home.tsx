import { useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { SearchHero } from "@/components/SearchHero";
import { Footer } from "@/components/Footer";
import { CoachCard } from "@/components/CoachCard";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { SidebarAd } from "@/components/SidebarAd";

interface CoachWithRating {
  id: number;
  name: string;
  sport: string;
  instagram: string | null;
  imageUrl: string | null;
  calculatedRating: string;
  feedbackCount: number;
}

const COACHES_PER_PAGE = 4;

export default function Home() {
  const [visibleCount, setVisibleCount] = useState(COACHES_PER_PAGE);
  
  const { data: coaches, isLoading } = useQuery<CoachWithRating[]>({
    queryKey: ["/api/featured-coaches"],
  });

  const allCoaches = coaches || [];
  const displayCoaches = allCoaches.slice(0, visibleCount);
  const hasMore = visibleCount < allCoaches.length;

  const loadMore = () => {
    setVisibleCount(prev => prev + COACHES_PER_PAGE);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow">
        <SearchHero />
        
        {/* Featured Coaches */}
        <section className="py-16 md:py-24 bg-gray-50 border-t border-gray-100">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#202020] mb-2">Featured Coaches</h2>
              <p className="text-[#666666]">Coaches selected by our team</p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-80 bg-white rounded-xl animate-pulse" />
                ))}
              </div>
            ) : displayCoaches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {displayCoaches.map((coach: any) => (
                  <CoachCard key={coach.id} coach={coach} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-[#666666] text-lg">No featured coaches yet. Check back soon!</p>
              </div>
            )}
            
            {hasMore && (
              <div className="mt-12 text-center">
                <Button 
                  onClick={loadMore}
                  className="px-8 py-3 bg-[#F5C518] text-[#111111] font-bold"
                  data-testid="button-view-all"
                >
                  View All
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[#202020] text-white relative overflow-hidden">
           {/* Abstract Decoration */}
           <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           
           <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
             <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Are you a Coach?</h2>
             <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
               Claim your profile today to start gathering reviews and growing your business. 
               Join thousands of coaches who use our platform.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Link href="/register">
                 <Button className="px-8 py-4 bg-[#F5C518] text-[#111111] font-bold text-lg" data-testid="button-claim-profile">
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
