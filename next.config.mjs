/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Externalize Sequelize and related packages to prevent bundling issues
  serverExternalPackages: ['sequelize', 'mysql2', 'pg-hstore'],
};

export default nextConfig;
