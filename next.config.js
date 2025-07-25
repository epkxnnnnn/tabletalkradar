import { withSentryConfig } from '@sentry/nextjs';
import path from 'path';
import webpack from 'webpack';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import './src/lib/polyfills.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@supabase/supabase-js', '@sentry/nextjs'],
  swcMinify: false,
  
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
    // Fix 'self is not defined' error for server-side rendering
    if (isServer) {
      // Provide global polyfills for server
      config.plugins.push(
        new webpack.DefinePlugin({
          self: 'global',
          window: 'global',
        })
      );
      
      // Add node polyfills
      config.plugins.push(new NodePolyfillPlugin({
        excludeAliases: ['console']
      }));
      
      // Add fallbacks for browser-specific modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }
    
    // Optimize webpack cache
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.join(process.cwd(), '.next/cache/webpack'),
        maxMemoryGenerations: 1,
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      };
    }
    
    // Reduce bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
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
