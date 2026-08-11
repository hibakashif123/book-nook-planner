import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SHELF_LABELS, type Book, type ShelfStatus } from "@/lib/books";
import { BookCard } from "@/components/BookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/shelves")({
  head: () => ({
    meta: [
      { title: "My shelves — BookTok" },
      { name: "description", content: "Your want-to-read, currently reading and finished books in one place." },
      { property: "og:title", content: "My shelves — BookTok" },
      { property: "og:description", content: "Track everything you're reading on BookTok." },
    ],
  }),
  component: ShelvesPage,
});

type ShelfRow = { id: string; status: ShelfStatus; progress: number | null; books: Book | null };

function ShelvesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user]);

  const { data, isLoading } = useQuery({
    queryKey: ["shelves", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shelf_items")
        .select("id, status, progress, books(*)")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ShelfRow[];
    },
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl">My shelves</h1>
      {isLoading && <Skeleton className="mt-8 h-64 w-full" />}
      {(Object.keys(SHELF_LABELS) as ShelfStatus[]).map((status) => {
        const items = (data ?? []).filter((item) => item.status === status && item.books);
        return (
          <section key={status} className="mt-12">
            <h2 className="text-2xl">{SHELF_LABELS[status]}</h2>
            {items.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Nothing here yet.{" "}
                <Link to="/search" className="text-gold underline">
                  Add a book
                </Link>
              </p>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-5">
                {items.map((item) => (
                  <div key={item.id}>
                    <BookCard book={item.books!} />
                    {status === "reading" && (
                      <p className="mt-1 text-xs text-gold">{item.progress ?? 0}% read</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
      <Button asChild variant="outline" className="mt-12">
        <Link to="/search">Add another book</Link>
      </Button>
    </div>
  );
}
