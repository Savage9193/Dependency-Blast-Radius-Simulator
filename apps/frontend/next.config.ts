const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: any) => {
    config.transpilePackages = ['@dbrs/shared'];
    return config;
  },
  transpilePackages: ['@dbrs/shared'],
};

export default nextConfig;