import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfileByUsername, SHELF_LABELS, type Book, type ReviewWithProfile, type ShelfStatus } from "@/lib/books";
import { BookCard } from "@/components/BookCard";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/u/$username")({
  head: () => ({
    meta: [
      { title: "Reader profile — BookTok" },
      { name: "description", content: "Shelves, ratings and reviews from this reader on BookTok." },
      { property: "og:title", content: "Reader profile — BookTok" },
      { property: "og:description", content: "See what this reader is reading and rating." },
    ],
  }),
  component: ProfilePage,
  errorComponent: ({ error }) => (
    <p role="alert" className="mx-auto max-w-6xl px-4 py-16">
      {error.message}
    </p>
  ),
  notFoundComponent: () => <p className="mx-auto max-w-6xl px-4 py-16">Reader not found.</p>,
});

type ShelfRow = { id: string; status: ShelfStatus; books: Book | null };

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfileByUsername(username),
  });
  const profile = profileQuery.data;

  const shelvesQuery = useQuery({
    queryKey: ["profile-shelves", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shelf_items")
        .select("id, status, books(*)")
        .eq("user_id", profile!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ShelfRow[];
    },
  });

  const reviewsQuery = useQuery({
    queryKey: ["profile-reviews", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles(id, username, display_name, bio, avatar_url), books(*)")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as ReviewWithProfile[];
    },
  });

  const followQuery = useQuery({
    queryKey: ["follow", profile?.id, user?.id],
    enabled: !!profile && !!user && profile.id !== user.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user!.id)
        .eq("following_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (followQuery.data) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user!.id)
          .eq("following_id", profile!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user!.id, following_id: profile!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (profileQuery.isLoading) {
    return <Skeleton className="mx-auto mt-12 h-64 max-w-6xl" />;
  }
  if (!profile) return <p className="mx-auto max-w-6xl px-4 py-16">Reader not found.</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="flex flex-wrap items-center gap-5">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={`${profile.username}'s avatar`}
            className="size-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-full border border-border bg-muted font-display text-2xl">
            {profile.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-4xl">{profile.display_name || profile.username}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="mt-2 max-w-lg text-sm text-muted-foreground">{profile.bio}</p>}
        </div>
        {user && user.id !== profile.id && (
          <Button
            variant={followQuery.data ? "outline" : "default"}
            onClick={() => toggleFollow.mutate()}
            disabled={toggleFollow.isPending}
          >
            {followQuery.data ? "Following" : "Follow"}
          </Button>
        )}
        {user?.id === profile.id && (
          <Button variant="outline" asChild>
            <Link to="/settings">Edit profile</Link>
          </Button>
        )}
      </header>

      {(Object.keys(SHELF_LABELS) as ShelfStatus[]).map((status) => {
        const items = (shelvesQuery.data ?? []).filter((i) => i.status === status && i.books);
        if (items.length === 0) return null;
        return (
          <section key={status} className="mt-12">
            <h2 className="text-2xl">{SHELF_LABELS[status]}</h2>
            <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-5">
              {items.map((item) => (
                <BookCard key={item.id} book={item.books!} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="mt-14">
        <h2 className="text-2xl">Reviews</h2>
        <div className="mt-5 space-y-4">
          {reviewsQuery.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
          {reviewsQuery.data?.map((review) => (
            <article key={review.id} className="rounded-sm border border-border bg-card p-5">
              <div className="flex flex-wrap items-center gap-3">
                <StarRating value={review.rating} size={14} />
                {review.books && (
                  <Link
                    to="/books/$bookId"
                    params={{ bookId: review.book_id }}
                    className="font-display text-lg hover:text-gold"
                  >
                    {review.books.title}
                  </Link>
                )}
              </div>
              {review.body && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {review.has_spoilers
                    ? "Contains spoilers — open the book page to read."
                    : review.body}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
