import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchBookById,
  fetchBookReviews,
  SHELF_LABELS,
  type ShelfStatus,
} from "@/lib/books";

import { Book3D } from "@/components/Book3D";

import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/books/$bookId")({
  head: () => ({
    meta: [
      { title: "Book — BookTok" },
      { name: "description", content: "Ratings, reviews and shelf status for this book on BookTok." },
      { property: "og:title", content: "Book — BookTok" },
      { property: "og:description", content: "See what readers thought of this book." },
    ],
  }),
  component: BookDetail,
  errorComponent: ({ error }) => (
    <p role="alert" className="mx-auto max-w-6xl px-4 py-16">
      {error.message}
    </p>
  ),
  notFoundComponent: () => <p className="mx-auto max-w-6xl px-4 py-16">Book not found.</p>,
});

function BookDetail() {
  const { bookId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const bookQuery = useQuery({ queryKey: ["book", bookId], queryFn: () => fetchBookById(bookId) });
  const reviewsQuery = useQuery({
    queryKey: ["reviews", bookId],
    queryFn: () => fetchBookReviews(bookId),
  });

  const shelfQuery = useQuery({
    queryKey: ["shelf", bookId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shelf_items")
        .select("*")
        .eq("book_id", bookId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const setShelf = useMutation({
    mutationFn: async (status: ShelfStatus) => {
      const { error } = await supabase
        .from("shelf_items")
        .upsert({ user_id: user!.id, book_id: bookId, status }, { onConflict: "user_id,book_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shelf"] });
      queryClient.invalidateQueries({ queryKey: ["shelves"] });
      toast.success("Shelf updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setProgress = useMutation({
    mutationFn: async (progress: number) => {
      const { error } = await supabase
        .from("shelf_items")
        .update({ progress })
        .eq("user_id", user!.id)
        .eq("book_id", bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shelf"] });
      toast.success("Progress saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const myReview = reviewsQuery.data?.find((r) => r.user_id === user?.id);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [spoilers, setSpoilers] = useState(false);
  const [progress, setProgressValue] = useState("0");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setBody(myReview.body ?? "");
      setSpoilers(myReview.has_spoilers);
    }
  }, [myReview?.id]);

  useEffect(() => {
    if (shelfQuery.data) setProgressValue(String(shelfQuery.data.progress ?? 0));
  }, [shelfQuery.data?.progress]);

  const saveReview = useMutation({
    mutationFn: async () => {
      if (rating < 1) throw new Error("Pick a star rating first.");
      const trimmed = body.trim().slice(0, 5000);
      const { error } = await supabase.from("reviews").upsert(
        {
          user_id: user!.id,
          book_id: bookId,
          rating,
          body: trimmed || null,
          has_spoilers: spoilers,
        },
        { onConflict: "user_id,book_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", bookId] });
      queryClient.invalidateQueries({ queryKey: ["discovery"] });
      toast.success("Review saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (bookQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const book = bookQuery.data;
  if (!book) return <p className="mx-auto max-w-6xl px-4 py-16">Book not found.</p>;

  const reviews = reviewsQuery.data ?? [];
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-10 md:grid-cols-[260px_1fr]">
        <div className="pt-2">
          <Book3D title={book.title} author={book.author} coverUrl={book.cover_url} width={200} />
        </div>

        <div>
          <h1 className="text-4xl leading-tight">{book.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {book.author}
            {book.published_year ? ` · ${book.published_year}` : ""}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-gold/70">Kashif Butt</p>
          <div className="mt-4 flex items-center gap-3">
            <StarRating value={average} />
            <span className="text-sm text-muted-foreground">
              {reviews.length ? `${average.toFixed(1)} from ${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "No ratings yet"}
            </span>
          </div>
          {book.description && (
            <p className="mt-5 max-w-2xl text-sm text-muted-foreground">{book.description}</p>
          )}

          <div className="mt-8">
            <h2 className="text-xl">Your shelf</h2>
            {user ? (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(SHELF_LABELS) as ShelfStatus[]).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={shelfQuery.data?.status === status ? "default" : "outline"}
                      onClick={() => setShelf.mutate(status)}
                      disabled={setShelf.isPending}
                    >
                      {SHELF_LABELS[status]}
                    </Button>
                  ))}
                </div>
                {shelfQuery.data?.status === "reading" && (
                  <div className="mt-4 flex items-end gap-2">
                    <div className="grid gap-1">
                      <Label htmlFor="progress">Progress (%)</Label>
                      <Input
                        id="progress"
                        className="w-28"
                        inputMode="numeric"
                        value={progress}
                        onChange={(e) => setProgressValue(e.target.value)}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const n = Math.max(0, Math.min(100, Number(progress) || 0));
                        setProgress.mutate(n);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Button className="mt-3" size="sm" onClick={() => navigate({ to: "/auth" })}>
                Sign in to shelve this book
              </Button>
            )}
          </div>

          <div className="mt-10">
            <h2 className="text-xl">{myReview ? "Your review" : "Write a review"}</h2>
            {user ? (
              <form
                className="mt-3 max-w-xl space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveReview.mutate();
                }}
              >
                <StarRating value={rating} onChange={setRating} size={26} />
                <Textarea
                  value={body}
                  maxLength={5000}
                  placeholder="What did you think? (optional)"
                  onChange={(e) => setBody(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Switch id="spoilers" checked={spoilers} onCheckedChange={setSpoilers} />
                  <Label htmlFor="spoilers">Contains spoilers</Label>
                </div>
                <Button type="submit" disabled={saveReview.isPending}>
                  {myReview ? "Update review" : "Post review"}
                </Button>
              </form>
            ) : (
              <Button className="mt-3" size="sm" onClick={() => navigate({ to: "/auth" })}>
                Sign in to review
              </Button>
            )}
          </div>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl">Reviews</h2>
        <div className="mt-5 space-y-4">
          {reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
          {reviews.map((review) => (
            <article key={review.id} className="rounded-sm border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <StarRating value={review.rating} size={14} />
                {review.profiles && (
                  <Link
                    to="/u/$username"
                    params={{ username: review.profiles.username }}
                    className="text-sm hover:text-gold"
                  >
                    {review.profiles.display_name || `@${review.profiles.username}`}
                  </Link>
                )}
              </div>
              {review.body &&
                (review.has_spoilers && !revealed[review.id] ? (
                  <button
                    type="button"
                    className="mt-3 text-sm text-gold underline"
                    onClick={() => setRevealed({ ...revealed, [review.id]: true })}
                  >
                    Spoilers — tap to reveal
                  </button>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {review.body}
                  </p>
                ))}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
