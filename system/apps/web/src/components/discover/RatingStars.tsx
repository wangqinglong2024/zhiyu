/**
 * E06 — Rating stars (1..5).
 * Read-only by default; pass `onRate` to enable interaction.
 */
import type { JSX } from 'react';
import { useState } from 'react';

interface Props {
  value: number; // 0..5
  count?: number;
  onRate?: (score: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function RatingStars({ value, count, onRate, size = 'md' }: Props): JSX.Element {
  const [hover, setHover] = useState<number>(0);
  const display = hover || value;
  const dim = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <div className="inline-flex items-center gap-2" data-testid="rating-stars">
      <div className={`flex ${dim} leading-none`}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= Math.round(display);
          return (
            <button
              type="button"
              key={n}
              disabled={!onRate}
              onMouseEnter={() => onRate && setHover(n)}
              onMouseLeave={() => onRate && setHover(0)}
              onClick={() => onRate && onRate(n)}
              className={`transition-transform ${onRate ? 'hover:scale-110 cursor-pointer' : 'cursor-default'} ${
                filled ? 'text-amber-400' : 'text-border'
              }`}
              aria-label={`${n} stars`}
              data-testid={`star-${n}`}
            >★</button>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs text-text-tertiary">({count})</span>
      )}
    </div>
  );
}
