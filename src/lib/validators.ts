import { z } from "zod";

export const FEED_TYPES = {
  USER_TIMELINE: "user_timeline",
  SEARCH: "search",
  HASHTAG: "hashtag",
  LIST: "list",
} as const;

export type FeedType = (typeof FEED_TYPES)[keyof typeof FEED_TYPES];

export const rssConfigSchema = z.discriminatedUnion("feedType", [
  z.object({
    feedType: z.literal(FEED_TYPES.USER_TIMELINE),
    username: z
      .string()
      .min(1, "Username is required")
      .regex(/^[A-Za-z0-9_]+$/, "Invalid username format"),
    includeReplies: z.boolean().default(false),
    includeRetweets: z.boolean().default(true),
  }),
  z.object({
    feedType: z.literal(FEED_TYPES.SEARCH),
    query: z.string().min(1, "Search query is required"),
    language: z.string().optional(),
  }),
  z.object({
    feedType: z.literal(FEED_TYPES.HASHTAG),
    hashtag: z
      .string()
      .min(1, "Hashtag is required")
      .regex(/^[A-Za-z0-9_]+$/, "Invalid hashtag format"),
  }),
  z.object({
    feedType: z.literal(FEED_TYPES.LIST),
    username: z
      .string()
      .min(1, "Username is required")
      .regex(/^[A-Za-z0-9_]+$/, "Invalid username format"),
    listSlug: z
      .string()
      .min(1, "List slug is required")
      .regex(/^[A-Za-z0-9_-]+$/, "Invalid list slug format"),
  }),
]);

export type RssConfig = z.infer<typeof rssConfigSchema>;
