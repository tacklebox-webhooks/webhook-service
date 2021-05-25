const { Pool } = require("pg");

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

const getCount = async (query, queryParams) => {
  const response = await db.query(query, queryParams);
  console.log(query, queryParams, response);
  const count = response.rows[0].count;
  return count;
};

const getEndpointCount = async (serviceId) => {
  const query = `SELECT count(*) FROM endpoints
    JOIN users ON endpoints.user_id = users.id
    WHERE users.service_id = $1`;
  const queryParams = [serviceId];
  return await getCount(query, queryParams);
};

const getEntities = async (query, queryParams) => {
  const response = await db.query(query, queryParams);
  console.log(query, queryParams, response);
  const entities = response.rows;
  return entities;
};

const getEvents = async (serviceId) => {
  const query = `SELECT e.uuid, ep.url as endpoint, et.name as type FROM events e
    JOIN event_types et ON et.id = e.event_type_id
    JOIN users u ON u.id = e.user_id
    JOIN endpoints ep ON ep.user_id = u.id
    WHERE u.service_id = $1`;
  const queryParams = [serviceId];
  return await getEntities(query, queryParams);
};

const getMessages = async (serviceId) => {
  const query = `SELECT m.uuid, m.status_code, m.created_at, m.delivered FROM messages m
    JOIN events e ON e.id = m.event_id
    JOIN event_types et ON et.id = e.event_type_id
    WHERE et.service_id = $1`;
  const queryParams = [serviceId];
  return await getEntities(query, queryParams);
};

const getUserCount = async (serviceId) => {
  const query = `SELECT count(*) FROM users
    WHERE users.service_id = $1`;
  const queryParams = [serviceId];
  return await getCount(query, queryParams);
};

const uuidToId = async (table, uuid) => {
  const query = `SELECT id FROM ${table} WHERE uuid = $1`;
  const queryParams = [uuid];
  const response = await db.query(query, queryParams);
  const entity = response.rows[0];
  return entity && entity.id;
};

module.exports = {
  getEndpointCount,
  getEvents,
  getMessages,
  getUserCount,
  uuidToId,
};
