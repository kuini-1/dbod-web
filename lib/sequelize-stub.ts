// Stub module to prevent Sequelize from loading PostgreSQL modules
// This file is used to replace pg-hstore imports in client-side code

export default function() {
  return {
    stringify: () => null,
    parse: () => ({})
  };
}
