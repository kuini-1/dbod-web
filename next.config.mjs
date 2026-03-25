/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Externalize Sequelize and related packages to prevent bundling issues
  serverExternalPackages: ['sequelize', 'mysql2', 'pg-hstore'],
  // Emit the minimal server bundle for easy deployment
  output: 'standalone',
};

export default nextConfig;
