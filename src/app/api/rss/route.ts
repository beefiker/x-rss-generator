import { fetchRssHubRss } from "@/lib/rsshub-fetcher";
import { NextRequest, NextResponse } from "next/server";

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

/**
 * Escape XML special characters
 * Handles URLs and text content properly
 */
const escapeXml = (str: string): string => {
  return str
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;") // Escape & only if not already an entity
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const generateRssXml = (
  title: string,
  description: string,
  link: string,
  feedUrl: string,
  items: RssItem[]
): string => {
  const itemsXml = items
    .map(
      (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${escapeXml(item.link)}</link>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="false">${item.guid}</guid>
    </item>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <link>${escapeXml(link)}</link>
    <atom:link href="${escapeXml(
      feedUrl
    )}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>en</language>${itemsXml}
  </channel>
</rss>`;
};

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const username = searchParams.get("username");
  const query = searchParams.get("q");
  const hashtag = searchParams.get("hashtag");
  const listSlug = searchParams.get("list");
  const excludeReplies = searchParams.get("exclude_replies");
  const excludeRetweets = searchParams.get("exclude_retweets");
  const language = searchParams.get("lang");

  let feedTitle = "";
  let feedDescription = "";
  let feedLink = "";

  // Generate feed metadata based on type
  switch (type) {
    case "user":
      if (!username) {
        return NextResponse.json(
          { error: "Username is required" },
          { status: 400 }
        );
      }
      feedTitle = `Twitter: @${username}`;
      feedDescription = `RSS feed for @${username}'s tweets`;
      feedLink = `https://x.com/${username}`;
      if (excludeReplies === "true") {
        feedDescription += " (excluding replies)";
      }
      if (excludeRetweets === "true") {
        feedDescription += " (excluding retweets)";
      }
      break;

    case "search":
      if (!query) {
        return NextResponse.json(
          { error: "Search query is required" },
          { status: 400 }
        );
      }
      feedTitle = `Twitter Search: ${query}`;
      feedDescription = `RSS feed for Twitter search: ${query}`;
      feedLink = `https://x.com/search?q=${encodeURIComponent(query)}`;
      if (language) {
        feedDescription += ` (language: ${language})`;
      }
      break;

    case "hashtag":
      if (!hashtag) {
        return NextResponse.json(
          { error: "Hashtag is required" },
          { status: 400 }
        );
      }
      feedTitle = `Twitter: #${hashtag}`;
      feedDescription = `RSS feed for #${hashtag} tweets`;
      feedLink = `https://x.com/hashtag/${hashtag}`;
      break;

    case "list":
      if (!username || !listSlug) {
        return NextResponse.json(
          { error: "Username and list slug are required" },
          { status: 400 }
        );
      }
      feedTitle = `Twitter List: ${listSlug} by @${username}`;
      feedDescription = `RSS feed for Twitter list: ${listSlug}`;
      feedLink = `https://x.com/i/lists/${listSlug}`;
      break;

    default:
      return NextResponse.json({ error: "Invalid feed type" }, { status: 400 });
  }

  // Get the RSS feed URL (the current request URL)
  const rssFeedUrl = request.nextUrl.toString();

  // Fetch RSS feed from RSSHub
  try {
    // Extract list ID from listSlug if provided
    // RSSHub uses list ID (numeric), not slug
    let listId: string | undefined;
    if (type === "list" && listSlug) {
      // Try to use listSlug as ID, or extract from URL if needed
      listId = listSlug;
    }

    // Fetch RSS feed from RSSHub
    const rssHubFeed = await fetchRssHubRss({
      type: type as "user" | "search" | "hashtag" | "list",
      username: username || undefined,
      query: query || undefined,
      hashtag: hashtag || undefined,
      listId: listId,
    });

    // Return the RSS feed directly from RSSHub
    // We proxy it to maintain consistent API interface
    return new NextResponse(rssHubFeed, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "X-Powered-By": "RSSHub",
      },
    });
  } catch (error) {
    console.error("Error fetching from RSSHub:", error);

    // Return error in RSS format
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch RSS feed from RSSHub instances. Please try again later.";

    const errorRssXml = generateRssXml(
      feedTitle,
      feedDescription,
      feedLink,
      rssFeedUrl,
      [
        {
          title: "Unable to fetch RSS feed",
          link: feedLink,
          description: errorMessage,
          pubDate: new Date().toUTCString(),
          guid: `error-${Date.now()}`,
        },
      ]
    );

    return new NextResponse(errorRssXml, {
      status: 503, // Service Unavailable
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=60", // Short cache for errors
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    });
  }
};
