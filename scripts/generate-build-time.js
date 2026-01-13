/**
 * Generate build timestamp file
 * This script runs during the build process to create a timestamp file
 */

const fs = require('fs');
const path = require('path');

const buildTime = new Date().toISOString();
const buildTimeData = {
  buildTime,
  buildTimeFormatted: new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }),
};

const outputPath = path.join(__dirname, '../src/lib/build-time.json');

fs.writeFileSync(outputPath, JSON.stringify(buildTimeData, null, 2), 'utf-8');
console.log(`✅ Build timestamp generated: ${buildTimeData.buildTimeFormatted}`);
