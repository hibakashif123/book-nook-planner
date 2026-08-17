import { createServerFn } from "@tanstack/react-start";
import { loadExternalBookDetails } from "./bookReviews.server";
import type { ExternalBookDetails } from "./bookReviews.server";

export const fetchExternalBookDetails = createServerFn({ method: "GET" })
  .inputValidator((input: { workId: string; title: string; author?: string | null }) => ({
    workId: String(input.workId).slice(0, 40),
    title: String(input.title).slice(0, 200),
    author: input.author ? String(input.author).slice(0, 120) : null,
  }))
  .handler(async ({ data }): Promise<ExternalBookDetails> => loadExternalBookDetails(data));
