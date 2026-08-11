import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ReviewWithProfile } from "@/lib/books";
import { StarRating } from "@/components/StarRating";
import { BookCover } from "@/components/BookCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Your feed — BookTok" },
      { name: "description", content: "Reviews and ratings from the readers you follow on BookTok." },
      { property: "og:title", content: "Your feed — BookTok" },
      { property: "og:description", content: "See what the readers you follow are finishing." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user]);

  const { data, isLoading } = useQuery({
    queryKey: ["feed", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: follows, error: fErr } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id);
      if (fErr) throw fErr;
      const ids = (follows ?? []).map((f) => f.following_id);
      if (ids.length === 0) return [] as ReviewWithProfile[];
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles(id, username, display_name, bio, avatar_url), books(*)")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as ReviewWithProfile[];
    },
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl">Your feed</h1>
      {isLoading && <Skeleton className="mt-8 h-64 w-full" />}
      {data && data.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Follow some readers to fill this up — open any review and visit their profile.
        </p>
      )}
      <div className="mt-8 space-y-4">
        {data?.map((review) => (
          <article key={review.id} className="flex gap-4 rounded-sm border border-border bg-card p-5">
            {review.books && (
              <Link
                to="/books/$bookId"
                params={{ bookId: review.book_id }}
                className="w-20 shrink-0"
              >
                <BookCover book={review.books} />
              </Link>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {review.profiles && (
                  <Link
                    to="/u/$username"
                    params={{ username: review.profiles.username }}
                    className="text-sm hover:text-gold"
                  >
                    {review.profiles.display_name || `@${review.profiles.username}`}
                  </Link>
                )}
                <span className="text-xs text-muted-foreground">rated</span>
                <StarRating value={review.rating} size={13} />
              </div>
              {review.books && (
                <Link
                  to="/books/$bookId"
                  params={{ bookId: review.book_id }}
                  className="mt-1 block font-display text-xl hover:text-gold"
                >
                  {review.books.title}
                </Link>
              )}
              {review.body && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {review.has_spoilers
                    ? "Contains spoilers — open the book page to read."
                    : review.body}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
