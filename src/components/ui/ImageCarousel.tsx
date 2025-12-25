import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImageCarouselProps {
    images: string[];
    className?: string;
}

export function ImageCarousel({ images, className }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) return null;

    const nextSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className={cn("relative group overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800", className)}>
            <div
                className="flex transition-transform duration-300 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((src, index) => (
                    <div key={index} className="w-full flex-shrink-0 h-full relative">
                        <img
                            src={src}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Navigation Arrows (Web) */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                    >
                        <div className="bg-black/30 hover:bg-black/50 text-white rounded-full p-1">
                            <ChevronLeft className="w-6 h-6" />
                        </div>
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                    >
                        <div className="bg-black/30 hover:bg-black/50 text-white rounded-full p-1">
                            <ChevronRight className="w-6 h-6" />
                        </div>
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {images.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {images.map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all shadow-sm",
                                index === currentIndex
                                    ? "bg-white scale-110"
                                    : "bg-white/50 hover:bg-white/75"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
