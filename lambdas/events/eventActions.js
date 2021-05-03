const { db, serviceUuidToPK } = require("./db");
const AWS = require("aws-sdk");
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });

const getEvent = async (eventUuid) => {
  const text = `SELECT events.uuid, event_types.uuid as event_type_id, users.uuid as user_id, payload, idempotency_key
      FROM events 
      JOIN event_types ON events.event_type_id = event_types.id
      JOIN users ON events.user_id = users.id
      WHERE events.uuid = $1`;
  const values = [eventUuid];

  try {
    const response = await db.query(text, values);
    if (response.rows.length === 0) {
      return newResponse(404, { Error: "Event not found" });
    }

    let event = response.rows[0];
    return newResponse(200, event);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not get event" });
  }
};

const createEvent = async (userUuid, body) => {
  const newEvent = await addEventToDb(userUuid, body);

  if (!newEvent) {
    return newResponse(500, { Error: "Could not add event" });
  }

  const topic_arn = await getTopicArn(newEvent.event_type_id);

  if (!topic_arn) {
    return newResponse(500, { Error: "Could not add event" });
  }

  try {
    await addEventToSNS(newEvent, topic_arn);
    return newResponse(202, newEvent);
  } catch (error) {
    console.log(error);
    return newResponse(500, { Error: "Could not add event" });
  }
};

const getTopicArn = async (eventUuid) => {
  const text = `SELECT sns_topic_arn FROM event_types WHERE uuid = $1`;
  const values = [eventUuid];

  try {
    const response = await db.query(text, values);
    let event_type = response.rows[0];
    return event_type.sns_topic_arn;
  } catch (error) {
    console.log(error);
    return;
  }
};

const addEventToSNS = async (event, topic_arn) => {
  const params = {
    TopicArn: topic_arn,
    Message: JSON.stringify(event.payload),
    MessageAttributes: {
      user_uuid: {
        DataType: "String",
        StringValue: event.user_id,
      },
    },
  };

  await sns.publish(params).promise();
};

const addEventToDb = async (userUuid, body) => {
  const { event_type_id, payload, idempotency_key } = body;
  const eventTypeId = await serviceUuidToPK("event_types", event_type_id);
  const userId = await serviceUuidToPK("users", userUuid);
  const text = `INSERT INTO events (event_type_id, user_id, payload, idempotency_key) VALUES ($1, $2, $3, $4) RETURNING *`;
  const values = [
    eventTypeId,
    userId,
    JSON.stringify(payload),
    idempotency_key,
  ];

  try {
    const response = await db.query(text, values);
    let event = response.rows[0];
    event = {
      event_type_id,
      user_id: userUuid,
      uuid: event.uuid,
      payload: event.payload,
      idempotency_key: event.idempotency_key,
    };
    return event;
  } catch (error) {
    console.log(error);
    return;
  }
};

const listEvents = async (userUuid) => {
  const text = `SELECT events.uuid, event_types.uuid as event_type_id, users.uuid as user_id, payload, idempotency_key
      FROM events 
      JOIN event_types ON events.event_type_id = event_types.id
      JOIN users ON events.user_id = users.id
      WHERE users.uuid = $1`;
  const values = [userUuid];

  try {
    const response = await db.query(text, values);
    const events = response.rows;
    return newResponse(200, events);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not get events" });
  }
};

const newResponse = (statusCode, body) => {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
};

module.exports = {
  getEvent,
  createEvent,
  listEvents,
};
