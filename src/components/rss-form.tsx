"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { generateRssFeedUrl } from "@/lib/rss-generator";
import {
  FEED_TYPES,
  rssConfigSchema,
  type FeedType,
  type RssConfig,
} from "@/lib/validators";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { Check, Copy } from "lucide-react";
import * as React from "react";

// Component for gravity-affected text sections
const GravityText = ({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const velocityX = useMotionValue(0);
  const velocityY = useMotionValue(0);
  const lastRotation = React.useRef(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLElement | null>(null);
  const boundsRef = React.useRef({ maxX: 30, maxY: 15 });

  // Get parent button element and calculate bounds based on fixed dimensions
  React.useEffect(() => {
    if (ref.current) {
      const button = ref.current.closest("button") as HTMLElement;
      if (button) {
        buttonRef.current = button;
        // Calculate bounds based on button dimensions (full width x 60px)
        const updateBounds = () => {
          if (ref.current && button) {
            // Get actual button dimensions
            const buttonRect = button.getBoundingClientRect();
            const buttonWidth = buttonRect.width;
            const buttonHeight = 60; // Fixed height
            const textRect = ref.current.getBoundingClientRect();
            // Calculate max offset from center (accounting for text size)
            // Ensure there's always room for movement, especially vertically
            const paddingX = 2; // Minimal horizontal padding for text visibility
            // For vertical: ensure at least some movement space even if text is tall
            // Use smaller padding or ensure minimum movement space
            const paddingY = Math.min(2, (buttonHeight - textRect.height) / 4);

            // Calculate maxX: button width / 2 - text width / 2 - padding
            const maxX = Math.max(
              0,
              buttonWidth / 2 - textRect.width / 2 - paddingX
            );

            // Calculate maxY: ensure there's always room for vertical movement
            // If text is very tall, still allow some movement (at least 4px)
            const calculatedMaxY =
              buttonHeight / 2 - textRect.height / 2 - paddingY;
            const maxY = Math.max(4, calculatedMaxY); // Minimum 4px movement space

            boundsRef.current = {
              maxX,
              maxY,
            };
          }
        };
        // Wait for layout, then calculate bounds
        setTimeout(updateBounds, 0);
        // Also update on resize (in case button size changes)
        const resizeObserver = new ResizeObserver(updateBounds);
        resizeObserver.observe(button);
        return () => resizeObserver.disconnect();
      }
    }
  }, []);

  useAnimationFrame((t, delta) => {
    // Sync with CSS rotation: 5s = 5000ms, 360deg per cycle
    const elapsed = t % 5000;
    const currentRotation = (elapsed / 5000) * 360;

    // Convert rotation to radians
    const radians = (currentRotation * Math.PI) / 180;

    // Calculate gravity direction vector (gravity always points "down" relative to rotation)
    // When rotated 0deg, gravity is down (y positive)
    // When rotated 90deg, gravity is right (x positive)
    // When rotated 180deg, gravity is up (y negative)
    // When rotated 270deg, gravity is left (x negative)
    const gravityX = Math.sin(radians);
    const gravityY = Math.cos(radians);

    // Track rotation change for smooth gravity transitions
    const rotationDelta = Math.abs(currentRotation - lastRotation.current);
    const adjustedDelta =
      rotationDelta > 180 ? 360 - rotationDelta : rotationDelta;

    // Gradually adjust velocity when gravity direction changes significantly
    // This allows smooth transitions instead of abrupt resets
    if (adjustedDelta > 2) {
      // Reduce velocity when rotation changes to allow new gravity direction to take effect
      const reductionFactor = 0.7;
      velocityX.set(velocityX.get() * reductionFactor);
      velocityY.set(velocityY.get() * reductionFactor);
    }
    lastRotation.current = currentRotation;

    // Gravity strength (acceleration) - increased for more visible falling
    // Ensure gravity is strong enough to overcome constraints
    const gravityStrength = 0.7; // Increased for more visible movement
    const damping = 0.99; // Minimal damping for continuous falling
    const deltaSeconds = delta / 1000;
    const frameScale = deltaSeconds * 60; // Normalize to 60fps (frame-rate independent)

    // Apply gravity force to velocity (continuous acceleration toward current "down")
    const gravityForceX = gravityX * gravityStrength;
    const gravityForceY = gravityY * gravityStrength;

    // Update velocity with gravity
    velocityX.set(velocityX.get() + gravityForceX * frameScale);
    velocityY.set(velocityY.get() + gravityForceY * frameScale);

    // Apply minimal damping (allows continuous acceleration)
    velocityX.set(velocityX.get() * damping);
    velocityY.set(velocityY.get() * damping);

    // Update position based on velocity
    const currentX = x.get();
    const currentY = y.get();
    const staggerMultiplier = 1 + index * 0.15; // More pronounced stagger

    // Apply velocity to position
    const newX = currentX + velocityX.get() * frameScale * staggerMultiplier;
    const newY = currentY + velocityY.get() * frameScale * staggerMultiplier;

    // Calculate boundary constraints based on button dimensions
    const { maxX, maxY } = boundsRef.current;

    // Constrain X position to stay within button bounds (strict enforcement)
    let constrainedX = newX;
    if (newX > maxX) {
      constrainedX = maxX;
      velocityX.set(Math.min(0, velocityX.get() * -0.5)); // Stop and reverse
    } else if (newX < -maxX) {
      constrainedX = -maxX;
      velocityX.set(Math.max(0, velocityX.get() * -0.5)); // Stop and reverse
    }

    // Constrain Y position to stay within button bounds (strict enforcement)
    // Allow movement but prevent overflow
    let constrainedY = newY;
    if (newY > maxY) {
      constrainedY = maxY;
      // Reverse velocity but allow some bounce to maintain movement
      velocityY.set(velocityY.get() * -0.6);
    } else if (newY < -maxY) {
      constrainedY = -maxY;
      // Reverse velocity but allow some bounce to maintain movement
      velocityY.set(velocityY.get() * -0.6);
    }

    // Apply constrained position
    x.set(constrainedX);
    y.set(constrainedY);
  });

  return (
    <motion.div
      ref={ref}
      style={{
        x,
        y,
        display: "inline-block",
      }}
    >
      {children}
    </motion.div>
  );
};

export const RssForm = () => {
  const [feedType, setFeedType] = React.useState<FeedType>(
    FEED_TYPES.USER_TIMELINE
  );
  const [username, setUsername] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [hashtag, setHashtag] = React.useState("");
  const [listSlug, setListSlug] = React.useState("");
  const [language, setLanguage] = React.useState("");
  const [includeReplies, setIncludeReplies] = React.useState(false);
  const [includeRetweets, setIncludeRetweets] = React.useState(true);
  const [generatedUrl, setGeneratedUrl] = React.useState("");
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const handleGenerate = (): void => {
    setError("");
    setGeneratedUrl("");

    try {
      let config: RssConfig;

      switch (feedType) {
        case FEED_TYPES.USER_TIMELINE:
          config = {
            feedType: FEED_TYPES.USER_TIMELINE,
            username,
            includeReplies,
            includeRetweets,
          };
          break;
        case FEED_TYPES.SEARCH:
          config = {
            feedType: FEED_TYPES.SEARCH,
            query,
            language: language || undefined,
          };
          break;
        case FEED_TYPES.HASHTAG:
          config = {
            feedType: FEED_TYPES.HASHTAG,
            hashtag,
          };
          break;
        case FEED_TYPES.LIST:
          config = {
            feedType: FEED_TYPES.LIST,
            username,
            listSlug,
          };
          break;
      }

      const validated = rssConfigSchema.parse(config);
      const url = generateRssFeedUrl(validated);
      setGeneratedUrl(url);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid configuration");
      }
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (generatedUrl) {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full mx-auto space-y-6">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="feedType">Feed Type</Label>
            <Select
              id="feedType"
              value={feedType}
              onChange={(e) => setFeedType(e.target.value as FeedType)}
            >
              <option value={FEED_TYPES.USER_TIMELINE}>User Timeline</option>
              <option value={FEED_TYPES.SEARCH}>Search Query</option>
              <option value={FEED_TYPES.HASHTAG}>Hashtag</option>
              <option value={FEED_TYPES.LIST}>User List</option>
            </Select>
          </div>

          {feedType === FEED_TYPES.USER_TIMELINE && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="elonmusk"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the X username without @
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeReplies"
                  checked={includeReplies}
                  onChange={(e) => setIncludeReplies(e.target.checked)}
                />
                <Label htmlFor="includeReplies" className="cursor-pointer">
                  Include Replies
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeRetweets"
                  checked={includeRetweets}
                  onChange={(e) => setIncludeRetweets(e.target.checked)}
                />
                <Label htmlFor="includeRetweets" className="cursor-pointer">
                  Include Retweets
                </Label>
              </div>
            </div>
          )}

          {feedType === FEED_TYPES.SEARCH && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">Search Query</Label>
                <Input
                  id="query"
                  placeholder="from:elonmusk OR #spacex"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use X search operators for advanced queries
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language (Optional)</Label>
                <Select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="">All Languages</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="pt">Portuguese</option>
                  <option value="zh">Chinese</option>
                </Select>
              </div>
            </div>
          )}

          {feedType === FEED_TYPES.HASHTAG && (
            <div className="space-y-2">
              <Label htmlFor="hashtag">Hashtag</Label>
              <Input
                id="hashtag"
                placeholder="javascript"
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the hashtag without #
              </p>
            </div>
          )}

          {feedType === FEED_TYPES.LIST && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="listUsername">List Owner Username</Label>
                <Input
                  id="listUsername"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="listSlug">List Slug</Label>
                <Input
                  id="listSlug"
                  placeholder="my-favorite-list"
                  value={listSlug}
                  onChange={(e) => setListSlug(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The list slug from the URL: x.com/i/lists/[list-slug]
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            className="w-full flex gap-1 items-center justify-center relative overflow-hidden !px-0 !py-0"
            style={{
              height: "60px",
            }}
            size="lg"
          >
            <GravityText index={0}>Generate</GravityText>
            <GravityText index={1}>RSS</GravityText>
            <GravityText index={2}>Feed</GravityText>
            <GravityText index={3}>URL</GravityText>
          </Button>
        </CardContent>
      </Card>

      {generatedUrl && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg">Generated RSS Feed URL</CardTitle>
            <CardDescription>
              Copy this URL and add it to your RSS reader
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={generatedUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="p-3 rounded-md bg-muted text-sm">
              <p className="font-medium mb-1">How to use:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Copy the generated URL above</li>
                <li>Open your favorite RSS reader (Feedly, Inoreader, etc.)</li>
                <li>Add a new feed using this URL</li>
                <li>Enjoy X content in your RSS reader!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
