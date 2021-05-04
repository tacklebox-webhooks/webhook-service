const { db, serviceUuidToPK } = require("./db");
const AWS = require("aws-sdk");
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });

const resendMessage = async (messageUuid, serviceUuid) => {
  const message = await getMessageToResend(messageUuid);
  if (!message) {
    return newResponse(404, { Error: "Could not find message to resend" });
  }

  try {
    const resend_arn = await getResendArn(serviceUuid);
    const params = createParams(message, resend_arn);
    await sns.publish(params).promise();
    return newResponse(202, {});
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not resend message" });
  }
};

const getMessageToResend = async (messageUuid) => {
  const text = `SELECT messages.endpoint, events.payload
    FROM messages
    JOIN events ON messages.event_id = events.id
    WHERE messages.uuid = $1`;
  const values = [messageUuid];

  try {
    const response = await db.query(text, values);
    if (!response.rows) return;

    const messageData = response.rows[0];
    return messageData;
  } catch (error) {
    console.error(error);
    return;
  }
};

const getResendArn = async (serviceUuid) => {
  const queryString =
    "SELECT sns_topic_arn FROM event_types WHERE name = 'test_manual_message'";
  const response = await db.query(queryString);
  let eventType = response.rows[0];

  if (!eventType) {
    eventType = await createResendEventType(serviceUuid);
    return eventType.sns_topic_arn;
  }

  return eventType.sns_topic_arn;
};

const createResendEventType = async (serviceUuid) => {
  const sns_topic_arn = await addResendTopicToSNS(serviceUuid);
  return await addResendEventTypeToDb(sns_topic_arn, serviceUuid);
};

const addResendTopicToSNS = async (serviceUuid) => {
  const snsTopicName = `CaptainHook_${serviceUuid}_test_manual_message`;
  const HTTPSuccessFeedbackRoleArn =
    "arn:aws:iam::946221510390:role/SNSSuccessFeedback";
  const HTTPFailureFeedbackRoleArn =
    "arn:aws:iam::946221510390:role/SNSFailureFeedback";
  const HTTPSuccessFeedbackSampleRate = "100";

  const snsParams = {
    Name: snsTopicName,
    Attributes: {
      HTTPSuccessFeedbackRoleArn,
      HTTPFailureFeedbackRoleArn,
      HTTPSuccessFeedbackSampleRate,
    },
  };

  const topic = await sns.createTopic(snsParams).promise();
  return topic.TopicArn;
};

const addResendEventTypeToDb = async (sns_topic_arn, serviceUuid) => {
  const serviceId = await serviceUuidToPK("services", serviceUuid);

  if (!serviceId) {
    throw new Error("Service Id not valid");
  }

  const text = `INSERT INTO event_types (service_id, name, sns_topic_arn)
    VALUES ($1, $2, $3)
    RETURNING service_id, name, sns_topic_arn, uuid`;
  const values = [serviceId, "test_manual_message", sns_topic_arn];
  const response = await db.query(text, values);
  const eventType = response.rows[0];
  return eventType;
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