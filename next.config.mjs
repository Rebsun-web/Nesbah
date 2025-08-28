import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@heroicons/react', '@headlessui/react', 'framer-motion'],
  },
  
  // Turbopack configuration (replaces deprecated turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Bundle analyzer (optional - uncomment to analyze bundle)
  // webpack: (config, { isServer, dev }) => {
  //   if (!isServer && !dev) {
  //     const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  //     config.plugins.push(
  //       new BundleAnalyzerPlugin({
  //         analyzerMode: 'static',
  //         openAnalyzer: false,
  //         reportFilename: 'bundle-report.html',
  //       })
  //     );
  //   }
  //   return config;
  // },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Fix for Next.js 15.5.2 template variable issue
    config.plugins = config.plugins.filter(plugin => {
      return plugin.constructor.name !== 'DefinePlugin' || 
             !plugin.definitions || 
             !plugin.definitions['process.env.NODE_ENV'];
    });
    
    // Optimize bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      },
    };
    
    return config;
  },
}

export default withFlowbiteReact(nextConfig)