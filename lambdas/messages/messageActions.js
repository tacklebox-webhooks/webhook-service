const { db } = require("./db");
const { newResponse } = require("./utils");
const AWS = require("aws-sdk");
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });

const resendMessage = async (messageUuid, serviceUuid) => {
  try {
    const message = await getMessageToResend(messageUuid);
    if (!message) {
      return newResponse(404, {
        error_type: "data_not_found",
        detail: "No message matches given uuid.",
      });
    }

    const resend_arn = await getResendArn(serviceUuid);
    const params = createParams(message, resend_arn);
    await sns.publish(params).promise();
    return newResponse(202, {});
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not resend message.",
    });
  }
};

const getMessageToResend = async (messageUuid) => {
  const text = `SELECT messages.endpoint, events.payload
    FROM messages
    JOIN events ON messages.event_id = events.id
    WHERE messages.uuid = $1`;
  const values = [messageUuid];

  const response = await db.query(text, values);
  const message = response.rows[0];
  return message;
};

const getResendArn = async (serviceUuid) => {
  const queryString =
    "SELECT sns_topic_arn FROM event_types WHERE name = 'manual_message'";
  const response = await db.query(queryString);
  let eventType = response.rows[0];

  if (eventType) {
    return eventType.sns_topic_arn;
  }
};

const createParams = (message, resend_arn) => {
  const { endpoint, payload } = message;
  return {
    TopicArn: resend_arn,
    Message: JSON.stringify(payload),
    MessageAttributes: {
      endpoint_url: {
        DataType: "String",
        StringValue: endpoint,
      },
    },
  };
};

const getMessage = async (messageUuid) => {
  const text = `SELECT uuid, event_id, endpoint, delivery_attempts
    FROM messages WHERE uuid = $1`;
  const values = [messageUuid];

  try {
    const response = await db.query(text, values);
    const message = response.rows[0];

    if (!message) {
      return newResponse(404, {
        error_type: "data_not_found",
        detail: "No message matches given uuid.",
      });
    }

    return newResponse(200, message);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get message.",
    });
  }
};

const listMessages = async (userUuid) => {
  const text = `SELECT messages.uuid, event_id, endpoint, delivery_attempts, delivered_at
    FROM messages
    JOIN events ON messages.event_id = events.id
    JOIN users ON events.user_id = users.id
    WHERE users.uuid = $1`;
  const values = [userUuid];

  try {
    const response = await db.query(text, values);
    let responseBody = response.rows;
    return newResponse(200, responseBody);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get messages.",
    });
  }
};

module.exports = {
  getMessage,
  resendMessage,
  listMessages,
};
