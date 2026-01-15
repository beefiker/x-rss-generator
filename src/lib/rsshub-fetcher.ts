/**
 * RSSHub RSS Feed Fetcher
 * RSSHub is a free, open-source RSS feed generator with Twitter/X support
 * Documentation: https://docs.rsshub.app
 */

interface FetchRssHubOptions {
  type: "user" | "search" | "hashtag" | "list";
  username?: string;
  query?: string;
  hashtag?: string;
  listId?: string;
  excludeReplies?: boolean;
  excludeRetweets?: boolean;
}

// List of public RSSHub instances (can be configured via env)
// Updated from: https://john-marques.github.io/rsshub-docs/guide/instances
// You can also self-host RSSHub for better reliability
const RSSHUB_INSTANCES = [
  process.env.RSSHUB_INSTANCE || "https://rsshub.pseudoyu.com", // 🇩🇪 Germany
  "https://rsshub.rssforever.com", // 🇦🇪 UAE
  "https://hub.slarker.me", // 🇺🇸 USA
  "https://rsshub.app", // Official
  "https://rsshub.rss.tips", // 🇺🇸 USA
  "https://rsshub.ktachibana.party", // 🇺🇸 USA
  "https://rsshub.woodland.cafe", // 🇩🇪 Germany
  "https://rss.owo.nz", // 🇩🇪 Germany
  "https://rss.wudifeixue.com", // 🇨🇦 Canada
  "https://yangzhi.app", // 🇯🇵 Japan
  "https://rss.littlebaby.lol/rsshub", // 🇺🇸 USA
  "https://rsshub.henry.wang", // 🇬🇧 UK
  "https://rss.peachyjoy.top", // 🇺🇸 USA
  "https://rsshub.speednet.icu", // 🇭🇰 Hong Kong
  "https://hub.rss.direct", // 🇸🇬 Singapore
  "https://rsshub.umzzz.com", // 🇭🇰 Hong Kong
];

/**
 * Build RSSHub RSS URL based on feed type
 */
const buildRssHubUrl = (
  instance: string,
  options: FetchRssHubOptions
): string => {
  switch (options.type) {
    case "user":
      if (!options.username) {
        throw new Error("Username is required for user timeline");
      }
      // RSSHub Twitter user route: /twitter/user/:id
      // Optional path segments: /excludeReplies and /excludeRetweets
      let userPath = `${instance}/twitter/user/${encodeURIComponent(
        options.username
      )}`;
      if (options.excludeReplies) {
        userPath += "/excludeReplies";
      }
      if (options.excludeRetweets) {
        userPath += "/excludeRetweets";
      }
      return userPath;

    case "search":
      if (!options.query) {
        throw new Error("Query is required for search");
      }
      // RSSHub Twitter keyword route: /twitter/keyword/:keyword
      return `${instance}/twitter/keyword/${encodeURIComponent(options.query)}`;

    case "hashtag":
      if (!options.hashtag) {
        throw new Error("Hashtag is required");
      }
      // RSSHub Twitter keyword route with hashtag
      return `${instance}/twitter/keyword/${encodeURIComponent(
        `#${options.hashtag}`
      )}`;

    case "list":
      if (!options.listId) {
        throw new Error("List ID is required");
      }
      // RSSHub Twitter list route: /twitter/list/:id
      return `${instance}/twitter/list/${encodeURIComponent(options.listId)}`;

    default:
      throw new Error(`Unsupported feed type: ${options.type}`);
  }
};

/**
 * Remove duplicate attributes from XML elements
 * RSSHub sometimes returns XML with duplicate attributes which is invalid XML
 */
const removeDuplicateAttributes = (xml: string): string => {
  // Match XML opening tags (including self-closing) with attributes
  // Pattern: <tagName attr1="value1" attr2="value2" ...> or <tagName ... />
  return xml.replace(
    /<([a-zA-Z][a-zA-Z0-9_:]*)([^>]*?)(\/?)>/g,
    (match, tagName, attributes, selfClosing) => {
      if (!attributes.trim()) {
        return match; // No attributes, return as-is
      }

      // Extract all attributes using a more robust regex
      // Handles: name="value", name='value', name=value (no quotes)
      const attrRegex =
        /([a-zA-Z][a-zA-Z0-9_:]*)\s*=\s*(["'])((?:(?!\2).)*)\2|([a-zA-Z][a-zA-Z0-9_:]*)\s*=\s*([^\s>]+)/g;
      const seenAttrs = new Map<string, string>();
      let attrMatch;
      const closingSlash = selfClosing ? "/" : "";

      // Collect unique attributes (keep first occurrence)
      while ((attrMatch = attrRegex.exec(attributes)) !== null) {
        const attrName = attrMatch[1] || attrMatch[4]; // Handle both quoted and unquoted
        const attrValue = attrMatch[3] || attrMatch[5];

        if (attrName && !seenAttrs.has(attrName)) {
          seenAttrs.set(attrName, attrValue || "");
        }
      }

      // Rebuild attributes string
      if (seenAttrs.size === 0) {
        return `<${tagName}${closingSlash}>`;
      }

      const uniqueAttrs = Array.from(seenAttrs.entries())
        .map(([name, value]) => {
          // Use double quotes and escape if needed
          const escapedValue = value.replace(/"/g, "&quot;");
          return `${name}="${escapedValue}"`;
        })
        .join(" ");

      return `<${tagName} ${uniqueAttrs}${closingSlash}>`;
    }
  );
};

/**
 * Fix invalid author tags in RSS XML
 * RSS 2.0 spec requires author to be in email format: "email@example.com (Name)"
 * RSSHub sometimes returns just names, which is invalid
 */
const fixAuthorTags = (xml: string): string => {
  // Match <author> tags that don't contain @ (invalid email format)
  // Replace with valid format: "noreply@rsshub.app (Original Name)"
  return xml.replace(/<author>([^<@]+)<\/author>/gi, (match, name) => {
    // Remove invalid author tags or convert to valid email format
    // RSS 2.0 spec: author must be email or email with name
    // We'll use a placeholder email format
    const cleanName = name.trim();
    if (cleanName && !cleanName.includes("@")) {
      // Convert to valid format: "email@domain.com (Name)"
      return `<author>noreply@rsshub.app (${cleanName})</author>`;
    }
    return match; // Already valid or empty
  });
};

/**
 * Sanitize RSS XML to fix common issues
 * - Unescaped ampersands
 * - Duplicate attributes
 * - Invalid author email addresses
 */
const sanitizeRssXml = (xml: string): string => {
  // Split XML into parts: CDATA sections and everything else
  const parts: Array<{ type: "cdata" | "xml"; content: string }> = [];
  let lastIndex = 0;
  const cdataRegex = /<!\[CDATA\[[\s\S]*?\]\]>/g;
  let match;

  // Extract CDATA sections and regular XML parts
  while ((match = cdataRegex.exec(xml)) !== null) {
    // Add XML before CDATA
    if (match.index > lastIndex) {
      parts.push({
        type: "xml",
        content: xml.substring(lastIndex, match.index),
      });
    }
    // Add CDATA section (don't modify)
    parts.push({
      type: "cdata",
      content: match[0],
    });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining XML after last CDATA
  if (lastIndex < xml.length) {
    parts.push({
      type: "xml",
      content: xml.substring(lastIndex),
    });
  }

  // Process only non-CDATA parts
  let sanitized = parts
    .map((part) => {
      if (part.type === "cdata") {
        return part.content; // Leave CDATA unchanged
      }
      // Fix issues in XML parts
      let fixed = part.content;
      // 1. Fix unescaped & characters
      fixed = fixed.replace(
        /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]{1,31});)/g,
        "&amp;"
      );
      // 2. Remove duplicate attributes
      fixed = removeDuplicateAttributes(fixed);
      return fixed;
    })
    .join("");

  // Fix invalid author tags (must be done on full XML, not parts)
  sanitized = fixAuthorTags(sanitized);

  return sanitized;
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
 * Fetch RSS feed from an RSSHub instance
 */
const fetchFromInstance = async (
  instance: string,
  options: FetchRssHubOptions
): Promise<string> => {
  const url = buildRssHubUrl(instance, options);

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RSSFeedGenerator/1.0; +https://github.com)",
    },
    // Disable Next.js caching to ensure fresh content from RSSHub
    cache: "no-store",
    // Add timeout
    signal: AbortSignal.timeout(15000), // 15 second timeout
  });

  if (!response.ok) {
    throw new Error(
      `RSSHub instance ${instance} returned ${response.status}: ${response.statusText}`
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
        `RSSHub instance ${instance} returned HTML instead of RSS (Content-Type: ${contentType}). The instance may be blocked or unavailable.`
      );
    }
    // Even if Content-Type is XML, validate the content
    if (!isValidRssXml(rawXml)) {
      throw new Error(
        `RSSHub instance ${instance} returned invalid RSS/XML content. The response may be an error page.`
      );
    }
  }

  // Sanitize the XML to fix unescaped ampersands
  return sanitizeRssXml(rawXml);
};

/**
 * Fetch RSS feed from RSSHub with automatic fallback
 * Tries multiple instances until one succeeds
 */
export const fetchRssHubRss = async (
  options: FetchRssHubOptions
): Promise<string> => {
  const errors: string[] = [];

  // Try each RSSHub instance until one works
  for (const instance of RSSHUB_INSTANCES) {
    try {
      const rssFeed = await fetchFromInstance(instance, options);
      console.log(`✅ Successfully fetched from RSSHub instance: ${instance}`);
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
    `All RSSHub instances failed:\n${errors.join("\n")}\n\n` +
      "Please try again later or consider self-hosting RSSHub for better reliability.\n" +
      "See: https://docs.rsshub.app/install/"
  );
};
