const { Pool } = require("pg");
const nullTimeValue = "1970-01-01T00:00:00.000Z";
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;
const host = process.env.DATABASE_HOST;
const database = process.env.DATABASE_NAME;
const port = 5432;
const db = new Pool({
  user,
  host,
  database,
  password,
  port,
});

const createUser = async (name, serviceUuid) => {
  const query = `INSERT INTO users(name, service_id)
    VALUES($1, $2)
    RETURNING uuid, name, created_at`;
  const serviceId = await uuidToId("services", serviceUuid);
  const queryParams = [name, serviceId];
  const response = await db.query(query, queryParams);
  const user = response.rows[0];
  return user;
};

const deleteEndpoints = async (userId) => {
  const query = `UPDATE endpoints
    SET deleted_at = NOW()
    WHERE user_id = $1 AND deleted_at = '${nullTimeValue}'
    RETURNING id`;
  const queryParams = [userId];
  const response = await db.query(query, queryParams);
  const deletedEndpoints = response.rows;
  return deletedEndpoints;
};

const deleteSubscriptions = async (userId) => {
  const query = `UPDATE subscriptions s
    SET deleted_at = NOW()
    FROM endpoints e
    JOIN users u ON e.user_id = u.id
    WHERE s.endpoint_id = e.id AND e.user_id = $1 AND s.deleted_at = '${nullTimeValue}'
    RETURNING s.id`;
  const queryParams = [userId];
  const response = await db.query(query, queryParams);
  const deletedSubscriptions = response.rows;
  return deletedSubscriptions;
};

const deleteUser = async (userUuid) => {
  const query = `UPDATE users
    SET deleted_at = NOW()
    WHERE uuid = $1 AND deleted_at = '${nullTimeValue}'
    RETURNING id`;
  const queryParams = [userUuid];
  const response = await db.query(query, queryParams);
  const deletedUser = response.rows[0];
  return deletedUser;
};

const getService = async (serviceUuid) => {
  const query = `SELECT * FROM services
    WHERE uuid = $1 AND deleted_at = '${nullTimeValue}'`;
  const queryParams = [serviceUuid];
  const response = await db.query(query, queryParams);
  const service = response.rows[0];
  return service;
};

const getSubscriptions = async (userId) => {
  const query = `SELECT subscription_arn
    FROM subscriptions s
    JOIN endpoints e ON s.endpoint_id = e.id
    JOIN users u ON e.user_id = u.id
    WHERE e.user_id = $1 AND e.deleted_at = '${nullTimeValue}' AND s.deleted_at = '${nullTimeValue}'`;
  const queryParams = [userId];
  const response = await db.query(query, queryParams);
  const subscriptions = response.rows;
  return subscriptions;
};

const getUser = async (userUuid) => {
  const query = `SELECT uuid, name, created_at
    FROM users
    WHERE uuid = $1 AND deleted_at = '${nullTimeValue}'`;
  const queryParams = [userUuid];
  const response = await db.query(query, queryParams);
  const user = response.rows[0];
  return user;
};

const listUsers = async (serviceUuid) => {
  const query = `SELECT users.uuid, users.name, users.created_at
    FROM users
    JOIN services ON users.service_id = services.id
    WHERE services.uuid = $1 AND users.deleted_at = '${nullTimeValue}'`;
  const queryParams = [serviceUuid];
  const response = await db.query(query, queryParams);
  const users = response.rows;
  return users;
};

const uuidToId = async (table, uuid) => {
  const text = `SELECT id FROM ${table} WHERE uuid = $1`;
  const values = [uuid];

  try {
    const response = await db.query(text, values);
    const responseBody = response.rows[0];
    return responseBody && responseBody.id;
  } catch (error) {
    console.log(error);
    return;
  }
};

module.exports = {
  createUser,
  deleteEndpoints,
  deleteSubscriptions,
  deleteUser,
  getService,
  getSubscriptions,
  getUser,
  listUsers,
};
