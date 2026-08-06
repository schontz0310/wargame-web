import type { NextConfig } from "next";

const isExport = process.env.NEXT_PUBLIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  ...(isExport ? { output: 'export' } : {}),
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  // Add rewrites for development (not used in static export)
  ...(isExport ? {} : {
    async rewrites() {
      return [
        {
          source: '/api/proxy/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`,
        },
      ];
    },
  }),
};

export default nextConfig;
