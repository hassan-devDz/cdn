const mysql = require("mysql");
require("dotenv/config");

// Create a MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Export the MySQL pool
module.exports = pool;
