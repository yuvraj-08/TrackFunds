import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@trackfunds/types', '@trackfunds/utils', '@trackfunds/ui-web'],
}

export default nextConfig
