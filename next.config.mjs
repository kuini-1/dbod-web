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
  // DB stack: instrumentation → sync-all pulls Sequelize; keep drivers external.
  serverExternalPackages: [
    'sequelize',
    'pg-hstore',
    'mysql2',
    'pg',
    'pg-connection-string',
  ],
  webpack: (config, { isServer, dev }) => {
    // Dev on Windows: persistent pack cache often logs "Unable to snapshot resolve dependencies"
    // (junctions, OneDrive, antivirus). Memory cache avoids PackFileCacheStrategy snapshot failures.
    if (dev) {
      config.cache = { type: 'memory' };
    }
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    // `serverExternalPackages` does not fully cover the instrumentation bundle.
    const dbExternal = ({ request }, callback) => {
      if (
        request === 'sequelize' ||
        request === 'mysql2' ||
        request === 'pg' ||
        request === 'pg-hstore' ||
        request === 'pg-connection-string'
      ) {
        return callback(undefined, `commonjs ${request}`);
      }
      callback();
    };
    const prev = config.externals;
    config.externals = [
      ...(Array.isArray(prev) ? prev : prev != null ? [prev] : []),
      dbExternal,
    ];
    return config;
  },
  // Emit the minimal server bundle for easy deployment
  output: 'standalone',
};

export default nextConfig;
