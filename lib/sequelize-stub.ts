// Stub module to prevent Sequelize from loading PostgreSQL modules
// This file is used to replace pg-hstore imports in client-side code

function createSequelizeStub() {
  return {
    stringify: () => null,
    parse: () => ({})
  };
}

export default createSequelizeStub;
