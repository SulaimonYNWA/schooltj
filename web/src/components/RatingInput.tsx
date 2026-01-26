import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingInputProps {
    onSelect: (rating: number) => void;
    initialRating?: number;
}

export default function RatingInput({ onSelect, initialRating = 0 }: RatingInputProps) {
    const [hover, setHover] = useState(0);
    const [rating, setRating] = useState(initialRating);

    const handleSelect = (val: number) => {
        setRating(val);
        onSelect(val);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
                {[...Array(10)].map((_, i) => {
                    const val = i + 1;
                    return (
                        <button
                            key={i}
                            type="button"
                            className="focus:outline-none transition-transform hover:scale-110"
                            onMouseEnter={() => setHover(val)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => handleSelect(val)}
                        >
                            <Star
                                size={24}
                                className={`${val <= (hover || rating)
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                    } transition-colors`}
                            />
                        </button>
                    );
                })}
            </div>
            <div className="text-xs font-medium text-gray-500">
                {rating > 0 ? `Selected: ${rating}/10` : 'Select a rating 1-10'}
            </div>
        </div>
    );
}
