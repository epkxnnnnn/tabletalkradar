// Load server polyfills FIRST
import './server-polyfill.js';

import { withSentryConfig } from '@sentry/nextjs';
import path from 'path';
import webpack from 'webpack';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr', '@sentry/nextjs'],
  
  eslint: {
    // Disable ESLint during builds for faster deployment
    ignoreDuringBuilds: true,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self' https://api.supabase.co https://www.googleapis.com https://pwscfkrouagstuyakfjj.supabase.co;",
          },
        ],
      },
    ]
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false, // Disabled to reduce bundle size
  
  // Build optimizations
  experimental: {
    optimizeCss: true,
  },
  
  images: {
    domains: ['pwscfkrouagstuyakfjj.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ],
    formats: ['image/webp', 'image/avif']
  },
  
  // Transpile packages that might use browser globals
  transpilePackages: [],
  
  webpack: (config, { isServer, dev }) => {
    // Fix for libraries that use 'self' and other browser globals
    if (isServer) {
      // Simple global definitions
      config.plugins.push(
        new webpack.DefinePlugin({
          'self': 'global',
        })
      );
    }
    
    // Disable aggressive caching and optimization that causes runtime errors
    if (!dev) {
      config.cache = false; // Disable filesystem caching to prevent runtime errors
    }
    
    // Minimal splitChunks to prevent webpack runtime undefined array access
    config.optimization = {
      ...config.optimization,
      splitChunks: false, // Disable splitChunks completely to prevent runtime errors
    };
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Optimize large imports
    config.resolve.alias = {
      ...config.resolve.alias,
      'lodash': 'lodash-es',
    };

    return config;
  },
}

// Sentry configuration removed

export default nextConfig
