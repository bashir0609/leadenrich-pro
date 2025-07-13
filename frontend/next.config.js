/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3001',
    NEXT_PUBLIC_SOCKET_URL: 'http://localhost:3001',
    NEXT_PUBLIC_APP_NAME: 'LeadEnrich Pro',
  },
}

module.exports = nextConfig