/**
 * Nitter RSS Feed Fetcher
 * Fetches RSS feeds from Nitter instances (privacy-focused Twitter frontend)
 */

interface FetchNitterOptions {
  type: "user" | "search" | "hashtag";
  username?: string;
  query?: string;
  hashtag?: string;
}

// List of public Nitter instances (can be configured via env)
const NITTER_INSTANCES = [
  process.env.NITTER_INSTANCE || "https://nitter.net",
  "https://nitter.poast.org",
  "https://nitter.privacydev.net",
  "https://nitter.42l.fr",
  "https://nitter.it",
];

/**
 * Build Nitter RSS URL based on feed type
 */
const buildNitterUrl = (
  instance: string,
  options: FetchNitterOptions
): string => {
  switch (options.type) {
    case "user":
      if (!options.username) {
        throw new Error("Username is required for user timeline");
      }
      return `${instance}/${encodeURIComponent(options.username)}/rss`;

    case "search":
      if (!options.query) {
        throw new Error("Query is required for search");
      }
      return `${instance}/search/rss?q=${encodeURIComponent(options.query)}`;

    case "hashtag":
      if (!options.hashtag) {
        throw new Error("Hashtag is required");
      }
      return `${instance}/search/rss?q=${encodeURIComponent(
        `#${options.hashtag}`
      )}`;

    default:
      throw new Error(`Unsupported feed type: ${options.type}`);
  }
};

/**
 * Validate that the response is actually XML/RSS and not HTML
 */
const isValidRssXml = (content: string): boolean => {
  const trimmed = content.trim();
  // Check if it starts with XML declaration or RSS tag
  // Also check for common HTML tags that indicate it's not RSS
  return (
    (trimmed.startsWith("<?xml") || trimmed.startsWith("<rss")) &&
    !trimmed.toLowerCase().startsWith("<!doctype html") &&
    !trimmed.toLowerCase().startsWith("<html") &&
    trimmed.includes("<rss") &&
    trimmed.includes("</rss>")
  );
};

/**
 * Fetch RSS feed from a Nitter instance
 */
const fetchFromInstance = async (
  instance: string,
  options: FetchNitterOptions
): Promise<string> => {
  const url = buildNitterUrl(instance, options);

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RSSFeedGenerator/1.0; +https://github.com)",
    },
    // Add timeout
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(
      `Nitter instance ${instance} returned ${response.status}: ${response.statusText}`
    );
  }

  // Check Content-Type header
  const contentType = response.headers.get("content-type") || "";
  const isXmlContentType =
    contentType.includes("xml") ||
    contentType.includes("rss") ||
    contentType.includes("application/rss+xml") ||
    contentType.includes("text/xml");

  const rawXml = await response.text();

  // Validate that the response is actually XML/RSS
  if (!isValidRssXml(rawXml)) {
    // If Content-Type suggests HTML or response looks like HTML, throw error
    if (
      contentType.includes("text/html") ||
      contentType.includes("text/plain") ||
      !isXmlContentType
    ) {
      throw new Error(
        `Nitter instance ${instance} returned HTML instead of RSS (Content-Type: ${contentType}). The instance may be blocked or unavailable.`
      );
    }
    // Even if Content-Type is XML, validate the content
    if (!isValidRssXml(rawXml)) {
      throw new Error(
        `Nitter instance ${instance} returned invalid RSS/XML content. The response may be an error page.`
      );
    }
  }

  return rawXml;
};

/**
 * Fetch RSS feed from Nitter with automatic fallback
 * Tries multiple instances until one succeeds
 */
export const fetchNitterRss = async (
  options: FetchNitterOptions
): Promise<string> => {
  const errors: string[] = [];

  // Try each Nitter instance until one works
  for (const instance of NITTER_INSTANCES) {
    try {
      const rssFeed = await fetchFromInstance(instance, options);
      console.log(`✅ Successfully fetched from ${instance}`);
      return rssFeed;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(`${instance}: ${errorMessage}`);
      console.warn(`⚠️ Failed to fetch from ${instance}: ${errorMessage}`);
      // Continue to next instance
    }
  }

  // If all instances failed, throw an error with details
  throw new Error(
    `All Nitter instances failed:\n${errors.join("\n")}\n\n` +
      "Please try again later or check if Nitter instances are available."
  );
};
