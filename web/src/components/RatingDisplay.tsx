import { Star } from 'lucide-react';

interface RatingDisplayProps {
    rating: number;
    count?: number;
    size?: number;
}

export default function RatingDisplay({ rating, count, size = 16 }: RatingDisplayProps) {
    // Internal rating is 1-10. Map it to 1-5 for display.
    const displayRating = rating / 2;
    const fullStars = Math.floor(displayRating);
    const hasHalfStar = displayRating - fullStars >= 0.25 && displayRating - fullStars < 0.75;
    const extraFullStar = displayRating - fullStars >= 0.75 ? 1 : 0;

    const finalFullStars = fullStars + extraFullStar;
    const finalHalfStar = !extraFullStar && hasHalfStar;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                    const isFull = i < finalFullStars;
                    const isHalf = !isFull && i === finalFullStars && finalHalfStar;

                    return (
                        <div key={i} className="relative">
                            <Star
                                size={size}
                                className="text-gray-300"
                            />
                            {isFull && (
                                <Star
                                    size={size}
                                    className="absolute inset-0 text-yellow-400 fill-yellow-400"
                                />
                            )}
                            {isHalf && (
                                <div className="absolute inset-0 overflow-hidden w-1/2">
                                    <Star
                                        size={size}
                                        className="text-yellow-400 fill-yellow-400"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <span className="text-sm font-semibold text-gray-700">
                {displayRating.toFixed(1)}
            </span>
            {count !== undefined && (
                <span className="text-xs text-gray-400">({count} reviews)</span>
            )}
        </div>
    );
}
