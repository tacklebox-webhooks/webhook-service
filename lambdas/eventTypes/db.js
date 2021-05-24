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

const createEventType = async (name, serviceId, TopicArn) => {
  console.log(name, serviceId, TopicArn);
  const query = `INSERT INTO event_types(name, service_id, sns_topic_arn)
    VALUES($1, $2, $3)
    RETURNING uuid, name, sns_topic_arn, created_at`;
  const queryParams = [name, serviceId, TopicArn];
  const response = await db.query(query, queryParams);
  const eventType = response.rows[0];
  return eventType;
};

const deleteEventType = async (eventTypeUuid) => {
  const text = `UPDATE event_types
    SET deleted_at = NOW()
    WHERE uuid = $1 AND deleted_at = '${nullTimeValue}'
    RETURNING id, sns_topic_arn`;
  const values = [eventTypeUuid];
  const response = await db.query(text, values);
  const deletedEventType = response.rows[0];
  return deletedEventType;
};

const deleteSubscriptions = async (eventTypeId) => {
  const query = `UPDATE subscriptions s
    SET deleted_at = NOW()
    WHERE s.event_type_id = $1 AND s.deleted_at = '${nullTimeValue}'
    RETURNING *`;
  const queryParams = [eventTypeId];
  const response = await db.query(query, queryParams);
  const deletedSubscriptions = response.rows;
  return deletedSubscriptions;
};

const getEventType = async (eventTypeUuid) => {
  const query = `SELECT uuid, name, sns_topic_arn, created_at
    FROM event_types
    WHERE uuid = $1 AND deleted_at = '${nullTimeValue}'`;
  const queryParams = [eventTypeUuid];
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

const getSubscriptions = async (eventTypeId) => {
  const query = `SELECT subscription_arn
    FROM subscriptions s
    WHERE s.event_type_id = $1 AND s.deleted_at = '${nullTimeValue}'`;
  const queryParams = [eventTypeId];
  const response = await db.query(query, queryParams);
  const subscriptions = response.rows;
  return subscriptions;
};

const listEventTypes = async (serviceUuid) => {
  const query = `SELECT et.uuid, et.name, et.created_at
    FROM event_types et
    JOIN services s ON et.service_id = s.id
    WHERE s.uuid = $1 AND et.deleted_at = '${nullTimeValue}'`;
  const queryParams = [serviceUuid];
  const response = await db.query(query, queryParams);
  const subscriptions = response.rows;
  return subscriptions;
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
  createEventType,
  deleteEventType,
  deleteSubscriptions,
  getEventType,
  getService,
  getSubscriptions,
  listEventTypes,
  uuidToId,
};
