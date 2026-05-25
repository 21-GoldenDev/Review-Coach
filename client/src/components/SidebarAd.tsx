export function SidebarAd({ side }: { side: "left" | "right" }) {
  return (
    <div className="w-full h-[600px] overflow-hidden rounded-lg shadow-md">
      <a href="#" target="_blank" className="block w-full h-full">
        <img
          src="/ads/left-ad.jpg"
          alt="Advertisement"
          className="w-full h-full object-contain"
        />
      </a>
    </div>
  );
}