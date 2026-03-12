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
        const scaledVal = val * 2;
        setRating(scaledVal);
        onSelect(scaledVal);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((val) => {
                    const currentRating = (hover || rating) / 2;
                    return (
                        <button
                            key={val}
                            type="button"
                            className="focus:outline-none transition-transform hover:scale-110"
                            onMouseEnter={() => setHover(val * 2)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => handleSelect(val)}
                        >
                            <Star
                                size={24}
                                className={`${val <= currentRating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                    } transition-colors`}
                            />
                        </button>
                    );
                })}
            </div>
            <div className="text-xs font-medium text-gray-500">
                {rating > 0 ? `Selected: ${rating / 2} stars` : 'Select a rating 1-5 stars'}
            </div>
        </div>
    );
}
