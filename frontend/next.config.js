/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  // Ensure static export works with app router
  trailingSlash: true,
}

module.exports = nextConfig
