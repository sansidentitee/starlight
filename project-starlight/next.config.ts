import type { NextConfig } from 'next';
const codespaceOrigin = process.env.CODESPACE_NAME && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
  ? `${process.env.CODESPACE_NAME}-3000.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}` : undefined;
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  allowedDevOrigins: ['127.0.0.1', ...(codespaceOrigin ? [codespaceOrigin] : [])],
  turbopack: { root: process.cwd() },
};
export default nextConfig;
