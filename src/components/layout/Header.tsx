import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-gold" />
          <span className="font-display text-2xl tracking-tight">BookTok</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm sm:flex">
          <Link to="/search" activeProps={{ className: "text-gold" }} className="hover:text-gold">
            Search
          </Link>
          <Link to="/study" activeProps={{ className: "text-gold" }} className="hover:text-gold">
            Study guides
          </Link>

          <Link to="/shelves" activeProps={{ className: "text-gold" }} className="hover:text-gold">
            Shelves
          </Link>
          <Link to="/feed" activeProps={{ className: "text-gold" }} className="hover:text-gold">
            Feed
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/search" className="sm:hidden" aria-label="Search books">
            <Search className="h-5 w-5" />
          </Link>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/settings">Account</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
