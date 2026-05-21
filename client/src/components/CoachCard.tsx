import { Link } from "wouter";
import { Star, Instagram, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface CoachWithRating {
  id: number;
  name: string;
  sport: string;
  instagram: string | null;
  imageUrl: string | null;
  calculatedRating: string;
  feedbackCount: number;
}

interface CoachCardProps {
  coach: CoachWithRating;
}

export function CoachCard({ coach }: CoachCardProps) {
  const initials = coach.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-200 overflow-visible"
      data-testid={`card-coach-${coach.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-14 h-14 border-2 border-gray-100" data-testid={`avatar-coach-${coach.id}`}>
            {coach.imageUrl ? (
              <AvatarImage src={coach.imageUrl} alt={coach.name} data-testid={`img-coach-${coach.id}`} />
            ) : null}
            <AvatarFallback className="bg-[#202020] text-white text-lg font-bold">
              {initials || <User className="w-6 h-6" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 
              className="text-lg font-bold text-[#202020] truncate"
              data-testid={`text-coach-name-${coach.id}`}
            >
              {coach.name}
            </h3>
            
            {coach.instagram && (
              <div className="flex items-center gap-1.5 text-[#666666] text-sm" data-testid={`text-instagram-${coach.id}`}>
                <Instagram className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">@{coach.instagram.replace('@', '')}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-4" data-testid={`text-stats-${coach.id}`}>
          <div className="flex items-center gap-1 text-[#F5C518]">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-bold text-[#333333]" data-testid={`text-rating-${coach.id}`}>{coach.calculatedRating}</span>
          </div>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-[#666666]" data-testid={`text-reviews-${coach.id}`}>
            {coach.feedbackCount} {coach.feedbackCount === 1 ? 'feedback' : 'feedbacks'}
          </span>
        </div>
        
        <Link href={`/coach/${coach.id}`}>
          <Button 
            className="w-full bg-[#F5C518] text-[#111111] font-bold border-[#F5C518]"
            data-testid={`button-view-profile-${coach.id}`}
          >
            View Profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
