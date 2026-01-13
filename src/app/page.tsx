import { RssForm } from "@/components/rss-form";
import { getBuildTimeFormatted } from "@/lib/build-time";

export default function Home() {
  const buildTime = getBuildTimeFormatted();

  return (
    <main className="min-h-screen text-white relative overflow-hidden">
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto py-16 sm:py-20 lg:py-24">
            {/* Header */}
            <header className="mb-12 sm:mb-16">
              <div className="mb-3">
                <span className="text-xs sm:text-sm font-medium text-gray-400 tracking-wider uppercase">
                  [ RSS Feed Generator ]
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-4">
                X RSS Feed Generator
              </h1>
              <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-2xl">
                Generate RSS feeds for X profiles, searches, hashtags, and
                lists. Add them to your RSS reader to stay updated.
              </p>
            </header>

            {/* Form */}
            {process.env.NODE_ENV === "development" ? (
              <div className="mb-16 sm:mb-20">
                <RssForm />
              </div>
            ) : (
              <div className="mb-16 sm:mb-20 rotating-form">
                <RssForm />
              </div>
            )}

            {/* Footer */}
            <footer className="pt-8 border-t border-gray-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-500">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <span>Powered by RSSHub</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="text-xs sm:text-sm">
                    Last updated: {buildTime}
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
