"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingWidgetProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

const sizes = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-7 h-7" };

export function RatingWidget({ value, onChange, size = "md", readonly = false }: RatingWidgetProps) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn("transition-transform", !readonly && "hover:scale-110 cursor-pointer", readonly && "cursor-default")}
        >
          <Star
            className={cn(
              sizes[size],
              "transition-colors",
              star <= active ? "fill-amber-400 text-amber-400" : "fill-transparent text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
