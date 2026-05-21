import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CoachCard } from "@/components/CoachCard";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";

interface CoachWithRating {
  id: number;
  name: string;
  sport: string;
  instagram: string | null;
  imageUrl: string | null;
  calculatedRating: string;
  feedbackCount: number;
}

export default function SearchResults() {
  const [location] = useLocation();
  // Extract query param manually since wouter doesn't provide a hook for it directly
  const searchParams = new URLSearchParams(window.location.search);
  const query = searchParams.get("q") || "";
  
  const { data: coaches, isLoading } = useQuery<CoachWithRating[]>({
    queryKey: ["/api/coaches-with-ratings", query],
    queryFn: async () => {
      const url = query 
        ? `/api/coaches-with-ratings?search=${encodeURIComponent(query)}`
        : "/api/coaches-with-ratings";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch coaches");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row items-baseline justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#202020]">
              Results for "{query}"
            </h1>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
               <span className="text-sm text-[#666666]">{coaches?.length || 0} coaches found</span>
               <button className="ml-4 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                 <SlidersHorizontal className="w-4 h-4" /> Filters
               </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="h-96 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : coaches && coaches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {coaches.map(coach => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-[#202020] mb-2">No coaches found</h3>
              <p className="text-[#666666] max-w-md text-center">
                We couldn't find any coaches matching "{query}". Try searching for a different sport or name.
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
