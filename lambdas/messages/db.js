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

const queries = {
  getMessageToResend: `SELECT messages.endpoint, events.payload
    FROM messages
    JOIN events ON messages.event_id = events.id
    WHERE messages.uuid = $1`,
  getResendArn:
    "SELECT sns_topic_arn FROM event_types WHERE name = 'manual_message'",
  getMessage: `SELECT uuid, event_id, endpoint, delivery_attempts
  FROM messages WHERE uuid = $1`,
  listMessages: `SELECT messages.uuid, event_id, endpoint, delivery_attempts, delivered_at
  FROM messages
  JOIN events ON messages.event_id = events.id
  JOIN users ON events.user_id = users.id
  WHERE users.uuid = $1`,
};

module.exports.db = pool;
module.exports.queries = queries;
