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
  getMessage: `SELECT uuid, endpoint, delivery_attempt, status_code, created_at, delivered
    FROM messages
    WHERE uuid = $1 AND deleted_at = '${nullTimeValue}'`,
  listMessages: `SELECT messages.uuid, events.uuid AS event_id, messages.endpoint, delivery_attempt, status_code, messages.created_at, delivered
    FROM messages
    JOIN events ON messages.event_id = events.id
    JOIN users ON events.user_id = users.id
    WHERE users.uuid = $1 AND messages.deleted_at = '${nullTimeValue}'
    ORDER BY messages.created_at DESC`,
};

module.exports.db = pool;
module.exports.queries = queries;
