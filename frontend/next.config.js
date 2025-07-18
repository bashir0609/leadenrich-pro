/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing environment variables
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3001',
    NEXT_PUBLIC_SOCKET_URL: 'http://localhost:3001',
    NEXT_PUBLIC_APP_NAME: 'LeadEnrich Pro',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_APP_DESCRIPTION: 'LeadEnrich Pro - Your AI-Powered Lead Enrichment Tool',
    NEXT_PUBLIC_APP_AUTHOR: 'Islah4',
    NEXT_PUBLIC_APP_AUTHOR_URL: 'https://github.com/bashir0609' ,
    NEXT_PUBLIC_APP_KEYWORDS: 'lead enrichment, AI, automation, CRM integration',
    NEXT_PUBLIC_APP_LOGO: '/logo.png',
    NEXT_PUBLIC_APP_FAVICON: '/favicon.ico',
    NEXT_PUBLIC_APP_THEME_COLOR: '#ffffff',
    NEXT_PUBLIC_APP_BACKGROUND_COLOR: '#ffffff',
    NEXT_PUBLIC_APP_TWITTER_HANDLE: '@bashir0609',
    NEXT_PUBLIC_APP_FACEBOOK_PAGE: 'https://www.facebook.com/islahwebservices',
    NEXT_PUBLIC_APP_LINKEDIN_PROFILE: 'https://www.linkedin.com/in/islah4/',
    NEXT_PUBLIC_APP_GITHUB_REPO: 'https://github.com/bashir0609/leadenrich-pro',
    NEXT_PUBLIC_APP_TERMS_URL: 'https://example.com/terms',
    NEXT_PUBLIC_APP_PRIVACY_URL: 'https://example.com/privacy',
    NEXT_PUBLIC_APP_CONTACT_EMAIL: 'islahwebservice@gmail.com',
    NEXT_PUBLIC_APP_SUPPORT_EMAIL: 'support@islahwebservice.com', 
  },
  // Add this block to ignore ESLint errors during the build
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig