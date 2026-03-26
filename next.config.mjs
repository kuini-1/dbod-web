/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Keep Sequelize externalized, but allow mysql2 to be traced into standalone output.
  serverExternalPackages: ['sequelize', 'pg-hstore'],
  // Emit the minimal server bundle for easy deployment
  output: 'standalone',
};

export default nextConfig;
