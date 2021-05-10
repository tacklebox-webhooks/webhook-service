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
  countUsers: `SELECT count(*) FROM users
    WHERE users.service_id = $1`,
  countEndpoints: `SELECT count(*) FROM endpoints
  JOIN users ON endpoints.user_id = users.id
  JOIN services ON users.service_id = services.id
  WHERE services.id = $1`,
  countEvents: `SELECT count(*) FROM events
  JOIN users ON events.user_id = users.id
  JOIN services ON users.service_id = services.id
  WHERE services.id = $1`,
  countMessages: `SELECT count(*) FROM messages
  JOIN events ON events.id = messages.event_id
  JOIN users ON events.user_id = users.id
  JOIN services ON users.service_id = services.id
  WHERE services.id = $1`,
  countFailedMessages: `SELECT count(*) FROM messages
  JOIN events ON events.id = messages.event_id
  JOIN users ON events.user_id = users.id
  JOIN services ON users.service_id = services.id
  WHERE services.id = $1 AND messages.delivered = FALSE`,
};

module.exports.db = pool;
module.exports.queries = queries;
