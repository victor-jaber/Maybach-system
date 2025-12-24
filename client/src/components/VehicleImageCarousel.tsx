import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VehicleImage } from "@shared/schema";

interface VehicleImageCarouselProps {
  images: VehicleImage[];
  vehicleName: string;
  fallbackImageUrl?: string | null;
}

export function VehicleImageCarousel({ images, vehicleName, fallbackImageUrl }: VehicleImageCarouselProps) {
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.order || 0) - (b.order || 0);
  });

  const allImages = sortedImages.length > 0 
    ? sortedImages 
    : (fallbackImageUrl ? [{ id: 0, vehicleId: 0, imageUrl: fallbackImageUrl, isPrimary: true, order: 0, createdAt: null }] : []);

  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  if (allImages.length === 0) {
    return (
      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
          <Car className="h-24 w-24 text-muted-foreground/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted group">
        <img
          src={allImages[currentIndex]?.imageUrl}
          alt={`${vehicleName} - Imagem ${currentIndex + 1}`}
          className="h-full w-full object-cover transition-opacity duration-300"
          data-testid="img-vehicle-carousel-main"
        />
        
        {allImages.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              onClick={goToPrevious}
              data-testid="button-carousel-prev"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              onClick={goToNext}
              data-testid="button-carousel-next"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? "bg-white w-4" 
                      : "bg-white/50 hover:bg-white/80"
                  }`}
                  data-testid={`button-carousel-dot-${index}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToSlide(index)}
              className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? "border-[#735C3F] ring-2 ring-[#735C3F]/20" 
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
              data-testid={`button-carousel-thumb-${index}`}
            >
              <img
                src={image.imageUrl}
                alt={`${vehicleName} - Miniatura ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
