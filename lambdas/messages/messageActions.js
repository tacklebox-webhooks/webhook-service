const { db, serviceUuidToPK } = require("./db");
const AWS = require("aws-sdk");
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });

const resendMessage = async (messageUuid) => {
  const params = await getMessageParams(messageUuid);

  if (!params) {
    return newResponse(404, { Error: "Could not find message to resend" });
  }

  try {
    await sns.publish(params).promise();
    return newResponse(202, {});
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not resend message" });
  }
};

const getMessageParams = async (messageUuid) => {
  const text = `SELECT messages.endpoint, events.payload, event_types.sns_topic_arn
    FROM messages
    JOIN events ON messages.event_id = events.id
    JOIN event_types ON events.event_type_id = event_types.id
    WHERE messages.uuid = $1`;
  const values = [messageUuid];

  try {
    const response = await db.query(text, values);
    if (!response.rows) return;

    const messageData = response.rows[0];
    return constructParams(messageData);
  } catch (error) {
    console.error(error);
    return;
  }
};

const constructParams = (messageData) => {
  const { endpoint, payload, sns_topic_arn } = messageData;
  return {
    TopicArn: sns_topic_arn,
    Message: JSON.stringify(payload),
    MessageAttributes: {
      url: {
        // need to know what attribute name we're using for this if not url!!!
        DataType: "String",
        StringValue: endpoint,
      },
    },
  };
};

const getMessage = async (messageId) => {
  const text = `SELECT uuid, event_id, endpoint, delivery_attempts
    FROM messages WHERE uuid = $1`;
  const values = [messageId];

  try {
    const response = await db.query(text, values);
    if (response.rows.length === 0) {
      return newResponse(404, { Error: "Message not found" });
    }

    let responseBody = response.rows[0];
    return newResponse(200, responseBody);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not get message" });
  }
};

const listMessages = async (userId) => {
  userId = await serviceUuidToPK(userId);

  if (!userId) {
    return newResponse(404, {
      Error: "Could not find user associated to message",
    });
  }

  const text = `SELECT messages.uuid, event_id, endpoint, delivery_attempts, delivered_at
    FROM messages
    JOIN events ON messages.event_id = events.id
    JOIN users ON events.user_id = users.id
    WHERE users.id = $1`;
  const values = [userId];

  try {
    const response = await db.query(text, values);
    let responseBody = response.rows;
    return newResponse(200, responseBody);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not get messages" });
  }
};

const newResponse = (statusCode, body) => {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
};

module.exports = {
  getMessage,
  resendMessage,
  listMessages,
};
