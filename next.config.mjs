/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Ensure `lib/**` is copied into `.next/standalone` for instrumentation → sync-all (Next 16+).
  outputFileTracingIncludes: {
    '/*': ['./lib/**/*'],
  },
  // Keep Sequelize externalized, but allow mysql2 to be traced into standalone output.
  serverExternalPackages: ['sequelize', 'pg-hstore'],
  // Emit the minimal server bundle for easy deployment
  output: 'standalone',
};

export default nextConfig;
