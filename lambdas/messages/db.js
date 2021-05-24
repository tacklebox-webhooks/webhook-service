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

const nullTimeValue = "1970-01-01T00:00:00.000Z";

const queries = {
  getMessageToResend: `SELECT messages.endpoint, events.payload
    FROM messages
    JOIN events ON messages.event_id = events.id
    WHERE messages.uuid = $1 AND messages.deleted_at = '${nullTimeValue}'`,
  getMessage: `SELECT m.uuid, m.endpoint, et.name AS event_type, m.delivery_attempt, m.status_code, m.created_at, m.delivered
    FROM messages m
    JOIN events e ON m.event_id = e.id
    JOIN event_types et ON e.event_type_id = et.id 
    WHERE m.uuid = $1 AND m.deleted_at = '${nullTimeValue}'`,
  listMessages: `SELECT m.uuid, e.uuid AS event_id, et.name AS event_type, m.endpoint, delivery_attempt, status_code, m.created_at, delivered
    FROM messages m
    JOIN events e ON m.event_id = e.id
    JOIN event_types et ON e.event_type_id = et.id
    JOIN users u ON e.user_id = u.id
    WHERE u.uuid = $1 AND m.deleted_at = '${nullTimeValue}'
    ORDER BY m.created_at DESC`,
};

module.exports.db = pool;
module.exports.queries = queries;
