/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // ✅ Skip ESLint during `next build` (Docker build fails otherwise)
  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
