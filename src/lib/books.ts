import { supabase } from "@/integrations/supabase/client";

export type Book = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  description: string | null;
  published_year: number | null;
  open_library_id: string | null;
  added_by: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export type ShelfStatus = "want_to_read" | "reading" | "read";

export const SHELF_LABELS: Record<ShelfStatus, string> = {
  want_to_read: "Want to read",
  reading: "Reading",
  read: "Read",
};

export type ReviewWithProfile = {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  body: string | null;
  has_spoilers: boolean;
  created_at: string;
  profiles: Profile | null;
  books?: Book | null;
};

export async function fetchBookById(id: string) {
  const { data, error } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Book | null;
}

export async function fetchBookReviews(bookId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profiles(id, username, display_name, bio, avatar_url)")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReviewWithProfile[];
}

export async function fetchDiscovery() {
  const [{ data: recentReviews, error: rErr }, { data: recentBooks, error: bErr }] =
    await Promise.all([
      supabase
        .from("reviews")
        .select("*, profiles(id, username, display_name, bio, avatar_url), books(*)")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase.from("books").select("*").order("created_at", { ascending: false }).limit(12),
    ]);
  if (rErr) throw rErr;
  if (bErr) throw bErr;

  const reviews = (recentReviews ?? []) as unknown as ReviewWithProfile[];
  const byBook = new Map<string, { book: Book; total: number; count: number }>();
  for (const review of reviews) {
    if (!review.books) continue;
    const entry = byBook.get(review.book_id) ?? { book: review.books, total: 0, count: 0 };
    entry.total += review.rating;
    entry.count += 1;
    byBook.set(review.book_id, entry);
  }
  const trending = [...byBook.values()]
    .map((e) => ({ book: e.book, average: e.total / e.count, count: e.count }))
    .sort((a, b) => b.count - a.count || b.average - a.average)
    .slice(0, 8);

  return { trending, reviews, recentBooks: (recentBooks ?? []) as Book[] };
}

export async function fetchProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

/** Finds an existing book row or creates one, deduping by Open Library id / title+author. */
export async function findOrCreateBook(input: {
  title: string;
  author: string;
  coverUrl?: string | null;
  description?: string | null;
  publishedYear?: number | null;
  openLibraryId?: string | null;
  userId: string;
}) {
  if (input.openLibraryId) {
    const { data } = await supabase
      .from("books")
      .select("*")
      .eq("open_library_id", input.openLibraryId)
      .maybeSingle();
    if (data) return data as Book;
  }
  const { data: existing } = await supabase
    .from("books")
    .select("*")
    .ilike("title", input.title)
    .ilike("author", input.author)
    .maybeSingle();
  if (existing) return existing as Book;

  const { data, error } = await supabase
    .from("books")
    .insert({
      title: input.title,
      author: input.author,
      cover_url: input.coverUrl ?? null,
      description: input.description ?? null,
      published_year: input.publishedYear ?? null,
      open_library_id: input.openLibraryId ?? null,
      added_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Book;
}
