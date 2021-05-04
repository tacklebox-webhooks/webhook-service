"use strict";
const zlib = require("zlib");
const { db } = require("./db");

exports.handler = async (event) => {
  console.log("Here");
  const payload = await Buffer.from(event.awslogs.data, "base64");
  const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));

  for (let i = 0; i < parsed.logEvents.length; i += 1) {
    const logEvent = parsed.logEvents[i];
    const message = JSON.parse(logEvent.message);
    console.log(message);

    // eventId will be same as messageId

    const endpoint = message.delivery.destination;
    const deliveryAttempts = message.delivery.attempts;
    const statusCode = message.delivery.statusCode;
    const messageStatus = message.status;
    const uuid = message.delivery.deliveryId;
    const timestamp = message.notification.timestamp;

    const text =
      "INSERT INTO messages(event_id, uuid, endpoint, delivery_attempts, delivered_at) VALUES($1, $2, $3, $4, $5)";
    const values = [eventId, uuid, endpoint, deliveryAttempts, timestamp];

    try {
      const response = await db.query(text, values);
      let responseBody = response.rows[0];
    } catch (error) {
      console.error(error);
    }
  }
};
