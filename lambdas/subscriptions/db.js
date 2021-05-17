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
const nullTimeValue = "1970-01-01T00:00:00.000Z";

const addEndpoint = async (userUuid, url) => {
  const query = `INSERT INTO endpoints(user_id, url)
    VALUES($1, $2)
    RETURNING id, uuid, url, created_at`;
  const userId = await uuidToId("users", userUuid);
  const queryParams = [userId, url];
  const response = await db.query(query, queryParams);
  const endpoint = response.rows[0];
  return endpoint;
};

const addSubscription = async (endpointId, eventTypeId, subscriptionArn) => {
  const query = `INSERT INTO subscriptions(endpoint_id, event_type_id, subscription_arn)
    VALUES($1, $2, $3)
    RETURNING uuid`;
  const queryParams = [endpointId, eventTypeId, subscriptionArn];
  const response = await db.query(query, queryParams);
  const subscription = response.rows[0];
  return subscription;
};

const deleteEndpoint = async (endpointUuid) => {
  const query = `UPDATE endpoints
    SET deleted_at = NOW()
    WHERE uuid = $1 AND deleted_at = '${nullTimeValue}'
    RETURNING uuid`;
  const queryParams = [endpointUuid];
  const response = await db.query(query, queryParams);
  const deletedEndpoint = response.rows[0];
  return deletedEndpoint;
};

const deleteSubscription = async (subscriptionArn) => {
  const query = `UPDATE subscriptions
    SET deleted_at = NOW()
    WHERE subscription_arn = $1 AND deleted_at = '${nullTimeValue}'
    RETURNING subscription_arn`;
  const queryParams = [subscriptionArn];
  const response = await db.query(query, queryParams);
  const subscription = response.rows[0];
  return subscription;
};

const deleteSubscriptions = async (endpointUuid) => {
  const query = `UPDATE subscriptions s
    SET deleted_at = NOW()
    FROM endpoints e
    WHERE s.endpoint_id = e.id AND e.uuid = $1 AND s.deleted_at = '${nullTimeValue}'
    RETURNING s.subscription_arn`;
  const queryParams = [endpointUuid];
  const response = await db.query(query, queryParams);
  const deletedSubscriptions = response.rows;
  return deletedSubscriptions;
};

const getEndpoint = async (endpointUuid) => {
  const query = `SELECT e.id, e.uuid, url, array_agg(et.name) AS event_types, e.created_at
    FROM subscriptions s
    JOIN endpoints e ON s.endpoint_id = e.id
    JOIN event_types et ON s.event_type_id = et.id
    WHERE e.uuid = $1 AND e.deleted_at = '${nullTimeValue}' AND s.deleted_at = '${nullTimeValue}'
    GROUP BY e.id`;
  const queryParams = [endpointUuid];
  const response = await db.query(query, queryParams);
  const endpoint = response.rows[0];
  return endpoint;
};

const getEventType = async (serviceUuid, name) => {
  const query = `SELECT et.id, et.service_id, et.uuid, et.name, et.sns_topic_arn
    FROM event_types et
    JOIN services s ON et.service_id = s.id
    WHERE s.uuid = $1 AND et.name = $2 AND et.deleted_at = '${nullTimeValue}'`;
  const queryParams = [serviceUuid, name];
  const response = await db.query(query, queryParams);
  const eventType = response.rows[0];
  return eventType;
};

const getService = async (serviceUuid) => {
  const query = `SELECT * FROM services
    WHERE uuid = $1 AND deleted_at = '${nullTimeValue}'`;
  const queryParams = [serviceUuid];
  const response = await db.query(query, queryParams);
  const service = response.rows[0];
  return service;
};

const getSubscriptions = async (endpointUuid) => {
  const query = `SELECT subscriptions.subscription_arn, event_types.name
    FROM endpoints
    JOIN subscriptions ON endpoints.id = subscriptions.endpoint_id
    JOIN event_types ON subscriptions.event_type_id = event_types.id
    WHERE endpoints.uuid = $1 AND subscriptions.deleted_at = '${nullTimeValue}'`;
  const queryParams = [endpointUuid];
  const response = await db.query(query, queryParams);
  const subscriptions = response.rows;
  return subscriptions;
};

const getUser = async (userUuid) => {
  const query = `SELECT * FROM users
    WHERE uuid = $1 AND deleted_at = '${nullTimeValue}'`;
  const queryParams = [userUuid];
  const response = await db.query(query, queryParams);
  const user = response.rows[0];
  return user;
};

const listEndpoints = async (userUuid) => {
  const query = `SELECT e.uuid, url, array_agg(et.name) AS event_types, e.created_at
    FROM subscriptions s
    JOIN endpoints e ON s.endpoint_id = e.id
    JOIN event_types et ON s.event_type_id = et.id
    JOIN users u ON e.user_id = u.id
    WHERE u.uuid = $1 AND e.deleted_at = '${nullTimeValue}' AND s.deleted_at = '${nullTimeValue}'
    GROUP BY e.id`;
  const queryParams = [userUuid];
  const response = await db.query(query, queryParams);
  const endpoints = response.rows;
  return endpoints;
};

const uuidToId = async (table, uuid) => {
  const query = `SELECT id FROM ${table} WHERE uuid = $1`;
  const queryParams = [uuid];
  const response = await db.query(query, queryParams);
  const entity = response.rows[0];
  return entity.id;
};

module.exports = {
  addEndpoint,
  addSubscription,
  deleteEndpoint,
  deleteSubscription,
  deleteSubscriptions,
  getEndpoint,
  getEventType,
  getService,
  getSubscriptions,
  getUser,
  listEndpoints,
};
