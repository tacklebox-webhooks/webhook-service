const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });
const { db } = require("./db");

const serviceUuidToPK = async (uuid) => {
  const text = "SELECT id FROM services WHERE uuid = $1";
  const values = [uuid];

  const response = await db.query(text, values);
  let responseBody = response.rows[0];
  return responseBody.id;
};

const createEventType = async (name, serviceId) => {
  let serviceIdPk;

  try {
    serviceIdPk = await serviceUuidToPK(serviceId);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not create event type" });
  }

  const snsParams = {
    Name: `CaptainHook_${serviceId}_${name}`,
  };

  // CreateTopic is idempotent, so if topic with given name already
  // exists, it will return existing ARN.
  let TopicArn;

  try {
    const result = await sns.createTopic(snsParams).promise();
    TopicArn = result.TopicArn;
    console.log(result);
  } catch (error) {
    console.error(error);
  }

  const text =
    "INSERT INTO event_types(name, service_id, sns_topic_arn) VALUES($1, $2, $3) RETURNING uuid, name, sns_topic_arn, created_at";
  const values = [name, serviceIdPk, TopicArn];

  try {
    const response = await db.query(text, values);
    let responseBody = response.rows[0];
    return newResponse(201, responseBody);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not create event type" });
  }
};

const listEventTypes = async (serviceId) => {
  const serviceIdPk = await serviceUuidToPK(serviceId);
  const text =
    "SELECT uuid, name, sns_topic_arn, created_at FROM event_types WHERE deleted_at IS NULL AND service_id = $1";
  const values = [serviceIdPk];

  try {
    const response = await db.query(text, values);
    let responseBody = response.rows;
    return newResponse(200, responseBody);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not get event types" });
  }
};

const getEventType = async (eventTypeId) => {
  const text =
    "SELECT uuid, name, sns_topic_arn, created_at FROM event_types WHERE uuid = $1 AND deleted_at IS NULL";
  const values = [eventTypeId];

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
const deleteEventType = async (serviceId, eventTypeId) => {
  const text =
    "UPDATE event_types SET deleted_at = NOW() WHERE uuid = $1 AND deleted_at IS NULL RETURNING sns_topic_arn";
  const values = [eventTypeId];

  try {
    const response = await db.query(text, values);

    if (response.rows.length === 0) {
      return newResponse(404, { Error: "Event type not found" });
    } else {
      const { sns_topic_arn } = response.rows[0]; // Pull event topic ARN from DB response
      const snsParams = { TopicArn: sns_topic_arn };

      // "This action is idempotent, so deleting a topic that does not exist does not result in an error."
      const result = await sns.deleteTopic(snsParams).promise();

      return newResponse(204, { Success: "Event type was deleted" });
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
  deleteEventType,
  getEventType,
  createEventType,
  listEventTypes,
};
