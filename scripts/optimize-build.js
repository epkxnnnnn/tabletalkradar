#!/usr/bin/env node

/**
 * Build optimization script to reduce webpack cache size and improve performance
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CACHE_DIRS = [
  '.next/cache',
  '.webpack-cache',
  'node_modules/.cache'
];

function clearCache() {
  console.log('🧹 Clearing build caches...');
  
  CACHE_DIRS.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`  Clearing ${dir}...`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  });
  
  console.log('✅ Cache cleared successfully');
}

function optimizeBuild() {
  console.log('🔧 Optimizing build configuration...');
  
  // Set environment variables for optimized builds
  process.env.NODE_ENV = 'production';
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.NEXT_OPTIMIZE_FONTS = 'true';
  process.env.NEXT_OPTIMIZE_IMAGES = 'true';
  
  console.log('✅ Build optimization environment configured');
}

function analyzeBundle() {
  console.log('📊 Analyzing bundle size...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'clear':
      clearCache();
      break;
    case 'optimize':
      optimizeBuild();
      break;
    case 'analyze':
      analyzeBundle();
      break;
    case 'full':
      clearCache();
      optimizeBuild();
      analyzeBundle();
      break;
    default:
      console.log(`
Usage: node scripts/optimize-build.js [command]

Commands:
  clear     - Clear all build caches
  optimize  - Set up optimized build environment
  analyze   - Run build with analysis
  full      - Clear cache, optimize, and build
      `);
  }
}

if (import.meta.url === new URL(import.meta.main ?? '', import.meta.url)) {
  main();
}

export { clearCache, optimizeBuild, analyzeBundle };
