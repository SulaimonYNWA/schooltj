import { Star } from 'lucide-react';

interface RatingDisplayProps {
    rating: number;
    count?: number;
    size?: number;
}

export default function RatingDisplay({ rating, count, size = 16 }: RatingDisplayProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center">
                {[...Array(10)].map((_, i) => (
                    <Star
                        key={i}
                        size={size}
                        className={`${i < Math.round(rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                    />
                ))}
            </div>
            <span className="text-sm font-semibold text-gray-700">
                {rating.toFixed(1)}
            </span>
            {count !== undefined && (
                <span className="text-xs text-gray-400">({count} reviews)</span>
            )}
        </div>
    );
}
