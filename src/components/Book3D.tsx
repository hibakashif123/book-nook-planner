import { useRef, useState } from "react";

type Props = {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  /** Width of the front cover in px. */
  width?: number;
  /** Thickness of the spine in px. */
  thickness?: number;
  className?: string;
  float?: boolean;
};

/**
 * A CSS-3D book that floats and tilts toward the pointer.
 * Purely presentational — no external 3D library.
 */
export function Book3D({
  title,
  author,
  coverUrl,
  width = 200,
  thickness = 28,
  className,
  float = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: -8, y: -28 });

  function handleMove(event: React.PointerEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -8 - py * 18, y: -28 + px * 34 });
  }

  const height = Math.round(width * 1.5);

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={() => setTilt({ x: -8, y: -28 })}
      className={className}
      style={{ perspective: "1400px", width, height, margin: "0 auto" }}
    >
      <div className={float ? "book3d-float" : undefined} style={{ width: "100%", height: "100%" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: "transform 220ms ease-out",
          }}
        >
          {/* Front cover */}
          <div
            className="overflow-hidden rounded-r-sm border border-border bg-card shadow-2xl"
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateZ(${thickness / 2}px)`,
              backfaceVisibility: "hidden",
            }}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={`Cover of ${title}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full flex-col justify-between p-4 text-center">
                <span className="font-display text-lg leading-tight text-gold">{title || "Untitled"}</span>
                <span className="text-xs text-muted-foreground">{author || "Unknown author"}</span>
              </div>
            )}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 32%, rgba(0,0,0,0.28) 100%)",
              }}
            />
          </div>

          {/* Back cover */}
          <div
            className="rounded-l-sm border border-border bg-card"
            style={{ position: "absolute", inset: 0, transform: `translateZ(-${thickness / 2}px) rotateY(180deg)` }}
          />

          {/* Spine */}
          <div
            className="flex items-center justify-center border-y border-border"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: thickness,
              height: "100%",
              transform: `rotateY(-90deg) translateZ(${thickness / 2}px)`,
              transformOrigin: "left center",
              background:
                "linear-gradient(90deg, var(--color-muted) 0%, var(--color-card) 45%, var(--color-muted) 100%)",
            }}
          >
            <span
              className="whitespace-nowrap font-display text-[10px] text-gold"
              style={{ transform: "rotate(90deg)" }}
            >
              {title?.slice(0, 26)}
            </span>
          </div>

          {/* Page block (right edge) */}
          <div
            style={{
              position: "absolute",
              top: 2,
              right: 0,
              width: thickness,
              height: "calc(100% - 4px)",
              transform: `rotateY(90deg) translateZ(${width - thickness / 2}px)`,
              transformOrigin: "right center",
              background:
                "repeating-linear-gradient(90deg, oklch(0.92 0.02 90) 0 1.5px, oklch(0.78 0.03 85) 1.5px 3px)",
            }}
          />

          {/* Top & bottom pages */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: thickness,
              transform: `rotateX(90deg) translateZ(${thickness / 2}px)`,
              transformOrigin: "top center",
              background: "oklch(0.9 0.02 90)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: thickness,
              transform: `rotateX(-90deg) translateZ(${thickness / 2}px)`,
              transformOrigin: "bottom center",
              background: "oklch(0.82 0.02 90)",
            }}
          />
        </div>
      </div>
      <div
        className="book3d-shadow mx-auto mt-4 rounded-[50%]"
        style={{ width: width * 0.7, height: 14, background: "radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)" }}
      />
    </div>
  );
}
