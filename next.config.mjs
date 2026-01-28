/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Set turbopack root to silence workspace warning
  turbopack: {
    root: process.cwd(),
  },
  // Externalize Sequelize and related packages to prevent bundling issues
  serverExternalPackages: ['sequelize', 'mysql2', 'pg-hstore'],
};

export default nextConfig;
