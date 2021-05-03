const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });
const { db } = require("./db");

const userUuidToPk = async (uuid) => {
  const text = "SELECT id FROM users WHERE uuid = $1";
  const values = [uuid];

  const response = await db.query(text, values);
  let responseBody = response.rows[0];
  return responseBody.id;
};

const getEventTypeInfo = async (uuid) => {
  const text = "SELECT id, sns_topic_arn FROM event_types WHERE uuid = $1";
  const values = [uuid];

  const response = await db.query(text, values);
  let responseBody = response.rows[0];
  return responseBody;
};

const saveEndpointToDb = async (userId, url) => {
  const text =
    "INSERT INTO endpoints(user_id, url) VALUES($1, $2) RETURNING id, uuid, url, created_at";
  const values = [userId, url];
  const response = await db.query(text, values);
  return response.rows[0];
};

const createEndpoint = async (userId, url, eventTypes) => {
  let userIdPk;

  try {
    userIdPk = await userUuidToPk(userId);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not create endpoint" });
  }

  // Create endpoint in DB

  let endpoint;

  try {
    const text =
      "INSERT INTO endpoints(user_id, url) VALUES($1, $2) RETURNING id, uuid, url, created_at";
    const values = [userIdPk, url];
    const response = await db.query(text, values);
    endpoint = response.rows[0];
    // endpoint = await saveEndpointToDb(userIdPk, url);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not create endpoint" });
  }

  // Subscribe endpoint to each specified event type
  for (let i = 0; i < eventTypes.length; i += 1) {
    let eventTypeUuid = eventTypes[i];
    let eventTypeInfo;

    try {
      const response = await getEventTypeInfo(eventTypeUuid);
      eventTypeInfo = response;
    } catch (error) {
      console.error(error);
      continue;
    }

    const snsParams = {
      Protocol: "https",
      TopicArn: eventTypeInfo.sns_topic_arn,
      Attributes: { RawMessageDelivery: "true" },
      Endpoint: endpoint.url,
      ReturnSubscriptionArn: true,
    };

    try {
      console.log("Subscribing endpoint to SNS topic");
      const subscription = await sns.subscribe(snsParams).promise();
      console.log(subscription);

      const query =
        "INSERT INTO subscriptions(endpoint_id, event_type_id, subscription_arn VALUES($1, $2, $3) RETURNING uuid";
      const queryValues = [
        endpoint.id,
        eventTypeInfo.id,
        subscription.SubscriptionArn,
      ];

      const subResponse = await db.query(query, queryValues);
      const sub = subResponse.rows[0];
      console.log(sub);
    } catch (error) {
      console.error(error);
      continue;
    }
  }

  return newResponse(201, endpoint);
};

const listEndpoints = async (userId) => {
  const userIdPk = await userUuidToPk(userId);
  const text =
    "SELECT uuid, url, created_at FROM endpoints WHERE deleted_at IS NULL AND user_id = $1";
  const values = [userIdPk];

  try {
    const response = await db.query(text, values);
    let responseBody = response.rows;
    return newResponse(200, responseBody);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not get event types" });
  }
};

const getEndpoint = async (endpointId) => {
  const text =
    "SELECT uuid, url, created_at FROM endpoints WHERE deleted_at IS NULL AND uuid = $1";
  const values = [endpointId];

  try {
    const response = await db.query(text, values);
    if (response.rows.length === 0) {
      return newResponse(404, { Error: "Event type not found" });
    } else {
      let responseBody = response.rows[0];
      return newResponse(200, responseBody);
    }
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not get event type" });
  }
};

// TODO: Set matching subscriptions as deleted
const deleteEndpoint = async (endpointId) => {
  // const text =
  // "UPDATE endpoints SET deleted_at = NOW() WHERE uuid = $1 AND deleted_at IS NULL RETURNING sns_topic_arn";

  const text = "DELETE FROM endpoints WHERE uuid = $1 RETURNING uuid";
  const values = [endpointId];

  try {
    const response = await db.query(text, values);
    console.log(response);
    if (response.rows.length === 0) {
      return newResponse(404, { Error: "Endpoint not found" });
    } else {
      return newResponse(204, {});
    }
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not delete event type" });
  }
};

const newResponse = (statusCode, body) => {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
};

module.exports = {
  deleteEndpoint,
  getEndpoint,
  createEndpoint,
  listEndpoints,
};
