import { Link } from "@tanstack/react-router";
import type { Book } from "@/lib/books";
import { StarRating } from "./StarRating";

export function BookCover({ book, className }: { book: Pick<Book, "title" | "cover_url">; className?: string }) {
  if (book.cover_url) {
    return (
      <img
        src={book.cover_url}
        alt={`Cover of ${book.title}`}
        loading="lazy"
        className={className ?? "aspect-2/3 w-full rounded-sm object-cover"}
      />
    );
  }
  return (
    <div
      className={
        (className ?? "aspect-2/3 w-full rounded-sm") +
        " flex items-center justify-center border border-border bg-muted p-3 text-center font-display text-sm text-muted-foreground"
      }
    >
      {book.title}
    </div>
  );
}

export function BookCard({
  book,
  average,
  count,
}: {
  book: Book;
  average?: number;
  count?: number;
}) {
  return (
    <Link
      to="/books/$bookId"
      params={{ bookId: book.id }}
      className="group block space-y-2"
    >
      <div className="overflow-hidden rounded-sm border border-border transition-colors group-hover:border-gold">
        <BookCover book={book} />
      </div>
      <div>
        <h3 className="line-clamp-2 font-display text-lg leading-tight">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        {typeof average === "number" && (
          <div className="mt-1 flex items-center gap-2">
            <StarRating value={average} size={13} />
            <span className="text-xs text-muted-foreground">
              {average.toFixed(1)} · {count} {count === 1 ? "review" : "reviews"}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
