import withFlowbiteReact from "flowbite-react/plugin/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React StrictMode to prevent duplicate renders in development
  reactStrictMode: false,
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Ensure WebSocket connections are properly handled
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
      // Fix HMR WebSocket issues
      config.devServer = {
        ...config.devServer,
        hot: true,
        client: {
          webSocketURL: 'auto://0.0.0.0:0/ws',
        },
      };
    }
    return config;
  },
  // Ensure proper HMR configuration
  experimental: {
    webpackBuildWorker: false,
  },
  // Fix HMR and WebSocket issues
  devIndicators: {
    buildActivity: false,
  },
}

export default withFlowbiteReact(nextConfig)