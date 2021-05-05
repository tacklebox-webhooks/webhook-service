const { db, queries } = require("./db");
const { newResponse, uuidToId } = require("./utils");
const AWS = require("aws-sdk");
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });

const getEvent = async (eventUuid) => {
  const text = queries.getEvent;
  const values = [eventUuid];

  try {
    const response = await db.query(text, values);
    const event = response.rows[0];

    if (!event) {
      return newResponse(404, {
        error_type: "data_not_found",
        detail: "No event matches given uuid.",
      });
    }

    return newResponse(200, event);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get event.",
    });
  }
};

const createEvent = async (userUuid, body) => {
  if (!body.event_type_id || !body.payload) {
    return newResponse(400, {
      error_type: "missing_parameter",
      detail: "'event_type_id' and 'payload' are both required.",
    });
  }

  const isUnique = await hasUniqueIdempotencyKey(body.idempotency_key);
  if (!isUnique) {
    return newResponse(404, {
      error_Type: "duplicate_found",
      detail: "An event with that idempotency key already exists.",
    });
  }

  const topicArn = await getTopicArn(body.event_type_id);
  if (!topicArn) {
    return newResponse(404, {
      error_Type: "data_not_found",
      detail: "No event type matches given uuid",
    });
  }

  try {
    const eventUuid = await addEventToSNS(userUuid, body.payload, topicArn);
    const newEvent = await addEventToDb(userUuid, eventUuid, body);
    return newResponse(202, newEvent);
  } catch (error) {
    console.log(error);
    return newResponse(500, { Error: "Could not add event" });
  }
};

const hasUniqueIdempotencyKey = async (idempotency_key) => {
  if (!idempotency_key) return true;

  const text = queries.hasUniqueIdempotencyKey;
  const values = [idempotency_key];

  try {
    const response = await db.query(text, values);
    const duplicates = response.rows;
    return duplicates.length === 0;
  } catch (error) {
    console.log(error);
    return;
  }
};

const getTopicArn = async (eventTypeUuid) => {
  const text = queries.getTopicArn;
  const values = [eventTypeUuid];

  try {
    const response = await db.query(text, values);
    let event_type = response.rows[0];
    return event_type.sns_topic_arn;
  } catch (error) {
    console.log(error);
    return;
  }
};

const addEventToSNS = async (userUuid, payload, topicArn) => {
  const params = {
    TopicArn: topicArn,
    Message: JSON.stringify(payload),
    MessageAttributes: {
      user_uuid: {
        DataType: "String",
        StringValue: userUuid,
      },
    },
  };

  const eventData = await sns.publish(params).promise();
  return eventData.MessageId;
};

const addEventToDb = async (userUuid, eventUuid, body) => {
  const { event_type_id, payload, idempotency_key } = body;
  const eventTypeId = await uuidToId("event_types", event_type_id);
  const userId = await uuidToId("users", userUuid);
  const text = queries.addEvent;
  const values = [
    eventUuid,
    eventTypeId,
    userId,
    JSON.stringify(payload),
    idempotency_key,
  ];

  const response = await db.query(text, values);
  const event = response.rows[0];
  return {
    event_type_id,
    user_id: userUuid,
    uuid: event.uuid,
    payload: event.payload,
    idempotency_key: event.idempotency_key,
  };
};

const listEvents = async (userUuid) => {
  const text = queries.listEvents;
  const values = [userUuid];

  try {
    const response = await db.query(text, values);
    const events = response.rows;
    return newResponse(200, events);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get events.",
    });
  }
};

module.exports = {
  getEvent,
  createEvent,
  listEvents,
};
