# Twitter RSS Feed Generator

A beautiful, modern web application that generates RSS feed URLs for Twitter/X.com content. Built with Next.js, TypeScript, and Tailwind CSS.

![Twitter RSS Feed Generator](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwind-css)

## Features

- 🎨 **Beautiful Modern UI** - Clean, responsive interface with smooth animations
- 🔄 **Multiple Feed Types** - Support for user timelines, searches, hashtags, and lists
- ✅ **Input Validation** - Zod-powered validation with helpful error messages
- 📋 **One-Click Copy** - Easy copying of generated RSS URLs
- 🎯 **Type-Safe** - Fully typed with TypeScript
- 🌐 **SEO Optimized** - Proper meta tags and semantic HTML
- 📱 **Mobile-First** - Responsive design that works on all devices

## Feed Types Supported

1. **User Timeline** - Follow a specific user's tweets

   - Option to include/exclude replies
   - Option to include/exclude retweets

2. **Search Query** - Track tweets matching a search query

   - Support for Twitter search operators
   - Optional language filtering

3. **Hashtag** - Monitor a specific hashtag

4. **User List** - Follow tweets from a Twitter list

## Getting Started

### Prerequisites

- **Node.js** 18+ or higher
- **npm**, **yarn**, or **pnpm**

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd twitter-rss-generator
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
twitter-rss-generator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── rss/
│   │   │       └── route.ts        # RSS feed API endpoint
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── ui/                     # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   └── switch.tsx
│   │   └── rss-form.tsx            # Main RSS form component
│   └── lib/
│       ├── utils.ts                # Utility functions
│       ├── validators.ts           # Zod schemas
│       └── rss-generator.ts        # RSS URL generation logic
├── public/                         # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## Architecture & Best Practices

### Code Organization

- **Functional Components** - All components use functional style with hooks
- **Type Safety** - Comprehensive TypeScript types and interfaces
- **Validation** - Zod schemas for runtime type checking
- **Component Structure** - Separated UI components from business logic
- **Server Components** - Utilizes Next.js 15 App Router features

### Design Patterns

- **Discriminated Unions** - Used for feed type configurations
- **Composition** - UI components built with composition in mind
- **Separation of Concerns** - Clear separation between UI, logic, and data

### Performance

- **Server-Side Rendering** - Optimized initial page load
- **Dynamic Imports** - Code splitting for optimal bundle size
- **Caching** - RSS feeds cached with appropriate headers

## Implementation Notes

### Twitter API Integration

The current implementation generates RSS feed URLs and provides a sample RSS structure. To fetch actual Twitter data, you'll need to:

1. **Twitter API v2** - Official Twitter API (requires approval and API keys)

   - Apply for API access at [developer.twitter.com](https://developer.twitter.com)
   - Implement OAuth 2.0 authentication
   - Use Twitter API endpoints to fetch tweets

2. **Alternative Services**
   - [Nitter](https://github.com/zedeus/nitter) - Privacy-focused Twitter frontend with RSS
   - [RSSHub](https://docs.rsshub.app/en/social-media.html#twitter) - Open-source RSS generator
   - [TweetPik](https://tweetpik.com/) - Tweet screenshot and RSS service

### Extending the Application

To add real Twitter data fetching:

1. Update `src/app/api/rss/route.ts` to fetch actual tweets
2. Add environment variables for API credentials
3. Implement caching strategy for API responses
4. Add error handling for rate limits

## Environment Variables

**No API keys required!** This application uses [RSSHub](https://github.com/DIYgod/RSSHub), a free, open-source RSS feed generator that supports Twitter/X feeds without requiring API credentials.

### Optional: Custom RSSHub Instance

You can optionally configure a custom RSSHub instance by creating a `.env.local` file:

```env
# Optional: Custom RSSHub instance URL (defaults to public instances)
RSSHUB_INSTANCE=https://rsshub.app
```

If not specified, the app will automatically try multiple public RSSHub instances with automatic fallback.

### Why RSSHub?

- ✅ **No API keys required** - No need for X.com developer account
- ✅ **No rate limits** - No credit/payment requirements
- ✅ **Open source** - Free and self-hostable
- ✅ **Free forever** - No costs or subscriptions
- ✅ **Automatic fallback** - Tries multiple instances if one is down
- ✅ **Supports lists** - Unlike Nitter, RSSHub supports Twitter lists
- ✅ **Active development** - Regularly maintained and updated

### Self-Hosting RSSHub (Optional)

For better reliability, you can self-host RSSHub:

```bash
docker run -d --name rsshub -p 1200:1200 diygod/rsshub
```

Then set `RSSHUB_INSTANCE=http://localhost:1200` in your `.env.local`.

## Building for Production

```bash
npm run build
npm run start
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **Validation**: Zod
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Built following best practices from the Next.js and TypeScript communities
- UI inspired by modern SaaS applications
- Follows the principles of clean code and maintainable architecture

---

**Note**: This tool generates RSS feed URLs. Actual Twitter data fetching requires proper API integration or third-party services. Twitter's official API has rate limits and requires authentication.
