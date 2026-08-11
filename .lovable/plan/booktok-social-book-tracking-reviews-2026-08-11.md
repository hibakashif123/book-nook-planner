# BookTok — social book tracking & reviews

A dark, gold-accented site where readers add books to their shelves, rate and review them, and follow other readers.

## Look and feel
Noir & Gold: near-black backgrounds (#0d0d0d / #1a1a1a), gold accents (#c9a84c, #f0d78c), editorial serif headings with a clean sans body. Book covers carry the color; the UI stays quiet around them.

## Pages
- **Home / Discovery** — trending books (by review count and average rating), recently reviewed, and a search bar.
- **Search** — search real books via Open Library; results show cover, title, author, year, with an "Add to shelf" action. A manual "Add a book yourself" form as fallback (title, author, cover URL or upload, description).
- **Book detail** — cover, metadata, average rating, all reviews, and shelf/rating controls for the signed-in user.
- **My shelves** — three tabs: Want to read, Reading, Read. Progress (current page / percent) on Reading. Remove or move between shelves.
- **Feed** — reviews and shelf activity from people you follow, newest first.
- **Profile (`/u/$username`)** — avatar, bio, shelf counts, their reviews, follow/unfollow button.
- **Settings** — edit username, display name, bio, avatar.
- **Auth** — email/password plus Google sign-in.

## Rules
- One review per user per book, editable; 1–5 stars with optional text and a spoiler flag (spoiler text hidden behind a tap).
- Ratings are separate from shelves — you can rate without a written review.
- Book averages recompute from reviews; a book shows review count and average.
- Books added manually are shared globally, deduped by title+author on insert.
- Public pages (book detail, profiles, discovery) are readable when signed out; adding, reviewing, and following require sign-in with an inline "Sign in to…" prompt.

## Technical notes
Lovable Cloud provides the database, auth, and image storage.

Tables: `profiles` (username unique, display_name, bio, avatar_url), `books` (title, author, cover_url, description, published_year, open_library_id, added_by), `shelf_items` (user_id, book_id, status, progress, unique per user+book), `reviews` (user_id, book_id, rating 1–5, body, has_spoilers, unique per user+book), `follows` (follower_id, following_id).

RLS: public SELECT on books, profiles, reviews, follows; insert/update/delete scoped to `auth.uid()`. Shelf items are readable by their owner and, for the profile view, by anyone (shelves are public). Grants issued for `anon` on public-read tables and `authenticated` on all.

Open Library search runs through a server function so results are cached and the request stays off the client. Avatars and manual covers go to a Cloud storage bucket. Data loading uses route loaders with TanStack Query.

## Build order
1. Enable Cloud, schema + RLS, auth pages and profile creation trigger.
2. Design tokens, shell, navigation.
3. Book search (Open Library + manual add), book detail.
4. Shelves and reading progress.
5. Reviews and ratings.
6. Follows, feed, public profiles.
7. Discovery/home page, SEO metadata per route.
