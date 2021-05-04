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
  getEventTypeInfo: "SELECT id, sns_topic_arn FROM event_types WHERE uuid = $1",
  saveEndpointToDb:
    "INSERT INTO endpoints(user_id, url) VALUES($1, $2) RETURNING id, uuid, url, created_at",
  saveSubscriptionToDb:
    "INSERT INTO subscriptions(endpoint_id, event_type_id, subscription_arn VALUES($1, $2, $3) RETURNING uuid",
  listEndpoints: `SELECT endpoints.uuid, url, endpoints.created_at
    FROM endpoints
    JOIN users ON endpoints.user_id = users.id
    WHERE users.uuid = $1 AND endpoints.deleted_at IS NULL`,
  getEndpoint:
    "SELECT uuid, url, created_at FROM endpoints WHERE deleted_at IS NULL AND uuid = $1",
  deleteEndpoint: "DELETE FROM endpoints WHERE uuid = $1 RETURNING uuid",
};

module.exports.db = pool;
module.exports.queries = queries;
