const { db, serviceUuidToPK } = require("./db");

const resendMessage = async (messageId) => {
  const message = await getMessageToResend(messageId);

  if (message) {
    // format SNS message object

    try {
      // add message object to SNS queue
      return newResponse(202, {});
    } catch (error) {
      console.error(error);
      return newResponse(500, { Error: "Could not resend message" });
    }
  } else {
    return newResponse(404, { Error: "Could not find message to resend" });
  }
};

const getMessage = async (messageId) => {
  const text = `SELECT uuid, event_id, endpoint, delivery_attempts
    FROM messages WHERE uuid = $1`;
  const values = [messageId];

  try {
    const response = await db.query(text, values);
    if (response.rows.length === 0) {
      return newResponse(404, { Error: "Message not found" });
    } else {
      let responseBody = response.rows[0];
      return newResponse(200, responseBody);
    }
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not get message" });
  }
};

const listMessages = async (userId) => {
  userId = await serviceUuidToPK(userId);

  if (userId) {
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
  } else {
    return newResponse(404, {
      Error: "Could not find user associated to message",
    });
  }
};

const getMessageToResend = async (messageId) => {
  const text = "SELECT * FROM messages WHERE uuid = $1";
  const values = [messageId];

  try {
    const response = await db.query(text, values);
    return response.rows[0];
  } catch (error) {
    console.error(error);
    return;
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
