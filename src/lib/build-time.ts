/**
 * Build time utility
 * Reads the build timestamp generated during build
 */

interface BuildTimeData {
  buildTime: string;
  buildTimeFormatted: string;
}

let buildTimeData: BuildTimeData | null = null;

export const getBuildTime = (): BuildTimeData | null => {
  if (buildTimeData) {
    return buildTimeData;
  }

  try {
    // In production, this file is generated during build
    // Using dynamic import for Next.js compatibility
    const data = require('./build-time.json') as BuildTimeData;
    buildTimeData = data;
    return data;
  } catch (error) {
    // Fallback if file doesn't exist (e.g., in development before first build)
    return null;
  }
};

export const getBuildTimeFormatted = (): string => {
  const data = getBuildTime();
  if (data) {
    return data.buildTimeFormatted;
  }
  // Fallback for development
  return 'Development mode';
};
