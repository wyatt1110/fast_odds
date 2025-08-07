/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  webpack: (config, { isServer }) => {


    // Ignore ws module warnings (related to Supabase)
    config.module.rules.push({
      test: /node_modules\/ws\/lib\/validation\.js$/,
      use: 'ignore-loader',
    });

    return config;
  },
}

module.exports = nextConfig 