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

const createService = async (name) => {
  const query = `INSERT INTO services(name)
    VALUES($1)
    RETURNING uuid, name, created_at`;
  const queryParams = [name];
  const response = await db.query(query, queryParams);
  const service = response.rows[0];
  return service;
};

const deleteEndpoints = async (serviceId) => {
  const query = `UPDATE endpoints e
    SET deleted_at = NOW()
    FROM users u
    WHERE e.user_id = u.id AND u.service_id = $1 AND e.deleted_at = '${nullTimeValue}'
    RETURNING e.id, e.uuid, e.url`;
  const queryParams = [serviceId];
  const response = await db.query(query, queryParams);
  const deletedEndpoints = response.rows;
  return deletedEndpoints;
};

const deleteEventTypes = async (serviceId) => {
  const query = `UPDATE event_types
    SET deleted_at = NOW()
    WHERE event_types.service_id = $1 AND event_types.deleted_at = '${nullTimeValue}'
    RETURNING *`;
  const queryParams = [serviceId];
  const response = await db.query(query, queryParams);
  const deletedEndpoints = response.rows;
  return deletedEndpoints;
};

const deleteService = async (serviceUuid) => {
  const query = `UPDATE services
    SET deleted_at = NOW()
    WHERE uuid = $1 AND deleted_at = '${nullTimeValue}'
    RETURNING id`;
  const queryParams = [serviceUuid];
  const response = await db.query(query, queryParams);
  const deletedService = response.rows[0];
  return deletedService;
};

const deleteSubscriptions = async (serviceId) => {
  const query = `UPDATE subscriptions su
    SET deleted_at = NOW()
    FROM event_types et
    WHERE su.event_type_id = et.id AND et.service_id = $1 AND su.deleted_at = '${nullTimeValue}'
    RETURNING su.id, su.subscription_arn`;
  const queryParams = [serviceId];
  const response = await db.query(query, queryParams);
  const deletedSubscriptions = response.rows;
  return deletedSubscriptions;
};

const deleteUsers = async (serviceId) => {
  const query = `UPDATE users
    SET deleted_at = NOW()
    WHERE users.service_id = $1 AND users.deleted_at = '${nullTimeValue}'
    RETURNING *`;
  const queryParams = [serviceId];
  const response = await db.query(query, queryParams);
  const deletedEndpoints = response.rows;
  return deletedEndpoints;
};

const getEventTypes = async (serviceId) => {
  const query = `SELECT sns_topic_arn
    FROM event_types et
    WHERE et.service_id = $1 AND et.deleted_at = '${nullTimeValue}'`;
  const queryParams = [serviceId];
  const response = await db.query(query, queryParams);
  const subscriptions = response.rows;
  return subscriptions;
};

const getService = async (serviceUuid) => {
  const query = `SELECT uuid, name
    FROM services
    WHERE uuid = $1 AND deleted_at = '${nullTimeValue}'`;
  const queryParams = [serviceUuid];
  const response = await db.query(query, queryParams);
  const service = response.rows[0];
  return service;
};

const getSubscriptions = async (serviceId) => {
  const query = `SELECT subscription_arn
    FROM subscriptions su
    JOIN event_types et ON su.event_type_id = et.id
    WHERE et.service_id = $1 AND et.deleted_at = '${nullTimeValue}' AND su.deleted_at = '${nullTimeValue}'`;
  const queryParams = [serviceId];
  const response = await db.query(query, queryParams);
  const subscriptions = response.rows;
  return subscriptions;
};

const listServices = async () => {
  const query = `SELECT uuid, name
    FROM services
    WHERE deleted_at = '${nullTimeValue}'`;
  const response = await db.query(query);
  const services = response.rows;
  return services;
};

module.exports = {
  createService,
  deleteEndpoints,
  deleteEventTypes,
  deleteService,
  deleteSubscriptions,
  deleteUsers,
  getEventTypes,
  getService,
  getSubscriptions,
  listServices,
};
