const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let sequelize;

const dbDialect = process.env.DB_DIALECT || 'sqlite';

if (dbDialect === 'mysql' || dbDialect === 'postgres') {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || (dbDialect === 'mysql' ? 3306 : 5432),
      dialect: dbDialect,
      logging: false,
      define: {
        timestamps: true,
        underscored: true
      }
    }
  );
} else {
  // Default SQLite configuration
  const isVercel = !!process.env.VERCEL;
  const dbFolder = isVercel ? '/tmp' : path.join(__dirname, '..', 'data');
  if (!isVercel && !fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }
  
  const dbPath = path.join(dbFolder, 'database.sqlite');
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
}

module.exports = sequelize;
