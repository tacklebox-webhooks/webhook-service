const { Pool } = require("pg");

const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;
const host = process.env.DATABASE_HOST;
const database = process.env.DATABASE_NAME;
const port = 5432;
const pool = new Pool({
  user,
  host,
  database,
  password,
  port,
});

const serviceUuidToPK = async (table, uuid) => {
  const text = `SELECT id FROM ${table} WHERE uuid = $1`;
  const values = [uuid];

  try {
    const response = await pool.query(text, values);
    const responseBody = response.rows[0];
    return responseBody.id;
  } catch (error) {
    console.log(error);
    return;
  }
};

module.exports.db = pool;
module.exports.serviceUuidToPK = serviceUuidToPK;
