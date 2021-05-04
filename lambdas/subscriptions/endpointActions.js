const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });
const { db, queries } = require("./db");
const { uuidToId, newResponse } = require("./utils");

const getEventTypeInfo = async (uuid) => {
  const text = queries.getEventTypeInfo;
  const values = [uuid];

  const response = await db.query(text, values);
  let responseBody = response.rows[0];
  return responseBody;
};

const saveEndpointToDb = async (userUuid, url) => {
  const text = queries.saveEndpointToDb;
  const values = [userUuid, url];
  const response = await db.query(text, values);
  return response.rows[0];
};

const createEndpoint = async (userUuid, url, eventTypes) => {
  if (!eventTypes || eventTypes.length === 0 || !url) {
    return newResponse(400, {
      error_type: "missing_parameter",
      detail: "'url' and a non-empty 'eventTypes' list are required.",
    });
  }

  const userId = await uuidToId("users", userUuid);
  if (!userId) {
    return newResponse(404, {
      error_type: "data_not_found",
      detail: "No user matches given uuid.",
    });
  }

  // Create endpoint in DB

  let endpoint;

  try {
    const text = queries.saveEndpointToDb;
    const values = [userId, url];
    const response = await db.query(text, values);
    endpoint = response.rows[0];
    // endpoint = await saveEndpointToDb(userId, url);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not create subscription.",
    });
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
    const FilterPolicy = JSON.stringify({ user_uuid: [userUuid] });

    const snsAttributes = {
      RawMessageDelivery: "true",
      FilterPolicy,
    };

    const snsParams = {
      Protocol: "https",
      TopicArn: eventTypeInfo.sns_topic_arn,
      Attributes: snsAttributes,
      Endpoint: endpoint.url,
      ReturnSubscriptionArn: true,
    };

    try {
      console.log("Subscribing endpoint to SNS topic");
      const subscription = await sns.subscribe(snsParams).promise();
      console.log(subscription);

      const query = queries.saveSubscriptionToDb;
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

const listEndpoints = async (userUuid) => {
  const text = queries.listEndpoints;
  const values = [userUuid];

  try {
    const response = await db.query(text, values);
    let responseBody = response.rows;
    return newResponse(200, responseBody);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get subscriptions.",
    });
  }
};

const getEndpoint = async (endpointUuid) => {
  const text = queries.getEndpoint;
  const values = [endpointUuid];

  try {
    const response = await db.query(text, values);
    const endpoint = response.rows[0];

    if (!endpoint) {
      return newResponse(404, {
        error_type: "data_not_found",
        detail: "No subscription matches given uuid.",
      });
    }

    return newResponse(200, endpoint);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get subscription.",
    });
  }
};

// TODO: Set matching subscriptions as deleted
const deleteEndpoint = async (endpointUuid) => {
  // const text =
  // "UPDATE endpoints SET deleted_at = NOW() WHERE uuid = $1 AND deleted_at IS NULL RETURNING sns_topic_arn";

  const text = queries.deleteEndpoint;
  const values = [endpointUuid];

  try {
    const response = await db.query(text, values);

    if (response.rows.length === 0) {
      return newResponse(404, {
        error_type: "data_not_found",
        detail: "No subscription matches given uuid.",
      });
    }

    return newResponse(204, {});
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not delete subscription.",
    });
  }
};

module.exports = {
  deleteEndpoint,
  getEndpoint,
  createEndpoint,
  listEndpoints,
};
