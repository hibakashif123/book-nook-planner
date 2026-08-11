import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = 18,
  className,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        const icon = (
          <Star
            width={size}
            height={size}
            className={cn(filled ? "fill-gold text-gold" : "text-muted-foreground")}
          />
        );
        return onChange ? (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            {icon}
          </button>
        ) : (
          <span key={star}>{icon}</span>
        );
      })}
    </div>
  );
}
