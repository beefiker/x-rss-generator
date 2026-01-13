# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Open Your Browser
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 How to Use

### Generate a User Timeline Feed
1. Select "User Timeline" from the dropdown
2. Enter a Twitter username (without @)
3. Toggle options for replies and retweets
4. Click "Generate RSS Feed URL"
5. Copy the URL and add it to your RSS reader

### Generate a Search Feed
1. Select "Search Query" from the dropdown
2. Enter your search query (supports Twitter operators)
3. Optionally select a language filter
4. Click "Generate RSS Feed URL"

### Generate a Hashtag Feed
1. Select "Hashtag" from the dropdown
2. Enter the hashtag (without #)
3. Click "Generate RSS Feed URL"

### Generate a List Feed
1. Select "User List" from the dropdown
2. Enter the list owner's username
3. Enter the list slug
4. Click "Generate RSS Feed URL"

---

## 🎯 Example Use Cases

**Follow a specific user:**
- Type: User Timeline
- Username: `elonmusk`
- Result: RSS feed of @elonmusk's tweets

**Track a topic:**
- Type: Search Query
- Query: `#javascript OR #typescript`
- Result: RSS feed of tweets about JavaScript or TypeScript

**Monitor a hashtag:**
- Type: Hashtag
- Hashtag: `webdev`
- Result: RSS feed of #webdev tweets

**Follow a curated list:**
- Type: User List
- Username: `twitter`
- List Slug: `official-partners`
- Result: RSS feed from Twitter's official partners list

---

## 🔧 Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

---

## 📝 Notes

- The current implementation generates RSS feed URLs with sample data
- To fetch real Twitter data, integrate with Twitter API v2 or use services like Nitter or RSSHub
- See the main README.md for detailed implementation instructions

---

## 🎨 Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zod** - Schema validation
- **Lucide React** - Beautiful icons

---

## 💡 Tips

1. **RSS Readers**: Use Feedly, Inoreader, NetNewsWire, or any RSS reader
2. **Twitter Operators**: Use advanced search operators in search queries
3. **Rate Limits**: Be aware of Twitter API rate limits when implementing real data fetching
4. **Caching**: RSS feeds are cached for 10 minutes by default

---

Enjoy your Twitter RSS feeds! 🎉
