/**
 * Twitter/X API v2 Client
 * Uses Bearer Token authentication for app-only access
 */

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  created_at?: string;
}

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id?: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  in_reply_to_user_id?: string;
  referenced_tweets?: Array<{
    type: "retweeted" | "quoted" | "replied_to";
    id: string;
  }>;
}

interface TwitterApiResponse<T> {
  data?: T | T[];
  errors?: Array<{
    message: string;
    code: number;
  }>;
  meta?: {
    result_count?: number;
    next_token?: string;
    oldest_id?: string;
    newest_id?: string;
  };
  includes?: {
    users?: TwitterUser[];
    tweets?: TwitterTweet[];
  };
}

interface FetchTweetsOptions {
  type: "user" | "search" | "hashtag" | "list";
  username?: string;
  query?: string;
  hashtag?: string;
  listSlug?: string;
  excludeReplies?: boolean;
  excludeRetweets?: boolean;
  language?: string;
  maxResults?: number;
}

interface Tweet {
  id: string;
  text: string;
  url: string;
  author: string;
  authorUsername: string;
  createdAt: string;
}

const API_BASE_URL = "https://api.x.com/2";

/**
 * Get Bearer Token from environment variables
 */
const getBearerToken = (): string => {
  const token = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    throw new Error(
      "X_BEARER_TOKEN or TWITTER_BEARER_TOKEN environment variable is required"
    );
  }
  return token;
};

/**
 * Make authenticated request to X API v2
 */
const apiRequest = async <T>(
  endpoint: string,
  params?: URLSearchParams
): Promise<TwitterApiResponse<T>> => {
  const bearerToken = getBearerToken();
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    params.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Twitter API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

/**
 * Get user ID from username
 */
const getUserIdByUsername = async (username: string): Promise<string> => {
  const response = await apiRequest<TwitterUser>(
    `/users/by/username/${encodeURIComponent(username)}`
  );

  if (response.errors || !response.data) {
    throw new Error(
      response.errors?.[0]?.message || `User @${username} not found`
    );
  }

  const user = Array.isArray(response.data) ? response.data[0] : response.data;
  if (!user) {
    throw new Error(`User @${username} not found`);
  }

  return user.id;
};

/**
 * Fetch user timeline tweets
 */
const fetchUserTweets = async (
  userId: string,
  options: FetchTweetsOptions
): Promise<Tweet[]> => {
  const params = new URLSearchParams();
  params.append("max_results", String(options.maxResults || 10));
  params.append(
    "tweet.fields",
    "created_at,author_id,public_metrics,referenced_tweets"
  );
  params.append("expansions", "author_id");
  params.append("user.fields", "username,name");

  // Combine exclude parameters into comma-separated list
  const excludeList: string[] = [];
  if (options.excludeReplies) {
    excludeList.push("replies");
  }
  if (options.excludeRetweets) {
    excludeList.push("retweets");
  }
  if (excludeList.length > 0) {
    params.append("exclude", excludeList.join(","));
  }

  const response = await apiRequest<TwitterTweet>(
    `/users/${userId}/tweets`,
    params
  );

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  const tweets = Array.isArray(response.data) ? response.data : [];
  if (tweets.length === 0) {
    return [];
  }

  const users = response.includes?.users || [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return tweets.map((tweet) => {
    const author = userMap.get(tweet.author_id || "");
    const tweetUrl = `https://x.com/${author?.username || "unknown"}/status/${
      tweet.id
    }`;

    return {
      id: tweet.id,
      text: tweet.text,
      url: tweetUrl,
      author: author?.name || "Unknown",
      authorUsername: author?.username || "unknown",
      createdAt: tweet.created_at,
    };
  });
};

/**
 * Search for recent tweets
 */
const searchTweets = async (options: FetchTweetsOptions): Promise<Tweet[]> => {
  const params = new URLSearchParams();

  // Build query
  let query = options.query || "";
  if (options.hashtag) {
    query = `#${options.hashtag}`;
  }

  // Add filters
  if (options.excludeReplies) {
    query += " -is:reply";
  }
  if (options.excludeRetweets) {
    query += " -is:retweet";
  }
  if (options.language) {
    query += ` lang:${options.language}`;
  }

  params.append("query", query);
  params.append("max_results", String(options.maxResults || 10));
  params.append("tweet.fields", "created_at,author_id,public_metrics");
  params.append("expansions", "author_id");
  params.append("user.fields", "username,name");

  const response = await apiRequest<TwitterTweet>(
    "/tweets/search/recent",
    params
  );

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  const tweets = Array.isArray(response.data) ? response.data : [];
  if (tweets.length === 0) {
    return [];
  }

  const users = response.includes?.users || [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return tweets.map((tweet) => {
    const author = userMap.get(tweet.author_id || "");
    const tweetUrl = `https://x.com/${author?.username || "unknown"}/status/${
      tweet.id
    }`;

    return {
      id: tweet.id,
      text: tweet.text,
      url: tweetUrl,
      author: author?.name || "Unknown",
      authorUsername: author?.username || "unknown",
      createdAt: tweet.created_at,
    };
  });
};

/**
 * Fetch tweets based on feed type
 */
export const fetchTweets = async (
  options: FetchTweetsOptions
): Promise<Tweet[]> => {
  try {
    switch (options.type) {
      case "user":
        if (!options.username) {
          throw new Error("Username is required for user timeline");
        }
        const userId = await getUserIdByUsername(options.username);
        return fetchUserTweets(userId, options);

      case "search":
        if (!options.query) {
          throw new Error("Query is required for search");
        }
        return searchTweets(options);

      case "hashtag":
        if (!options.hashtag) {
          throw new Error("Hashtag is required");
        }
        return searchTweets({ ...options, type: "hashtag" });

      case "list":
        // Lists require OAuth 1.0a user context, which is more complex
        // For now, we'll throw an error suggesting alternatives
        throw new Error(
          "List feeds require OAuth 1.0a user context authentication. " +
            "Please use user timeline, search, or hashtag feeds instead."
        );

      default:
        throw new Error(`Unsupported feed type: ${options.type}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error fetching tweets");
  }
};
