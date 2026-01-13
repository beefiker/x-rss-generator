import type { RssConfig } from "./validators";
import { FEED_TYPES } from "./validators";

export const generateRssFeedUrl = (config: RssConfig): string => {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const apiPath = "/api/rss";

  const params = new URLSearchParams();

  switch (config.feedType) {
    case FEED_TYPES.USER_TIMELINE:
      params.set("type", "user");
      params.set("username", config.username);
      if (!config.includeReplies) {
        params.set("exclude_replies", "true");
      }
      if (!config.includeRetweets) {
        params.set("exclude_retweets", "true");
      }
      break;

    case FEED_TYPES.SEARCH:
      params.set("type", "search");
      params.set("q", config.query);
      if (config.language) {
        params.set("lang", config.language);
      }
      break;

    case FEED_TYPES.HASHTAG:
      params.set("type", "hashtag");
      params.set("hashtag", config.hashtag);
      break;

    case FEED_TYPES.LIST:
      params.set("type", "list");
      params.set("username", config.username);
      params.set("list", config.listSlug);
      break;
  }

  return `${baseUrl}${apiPath}?${params.toString()}`;
};
