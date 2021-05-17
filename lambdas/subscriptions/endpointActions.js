const db = require("./db");
const sns = require("./sns");
const {
  extractChanges,
  formatEndpoint,
  newResponse,
  validateEventTypes,
  validateUrl,
} = require("./utils");

const addSubscriptions = async (
  serviceUuid,
  eventTypes,
  endpoint,
  userUuid
) => {
  return await Promise.all(
    eventTypes.map(async (eventTypeName) => {
      try {
        const eventType = await db.getEventType(serviceUuid, eventTypeName);
        const subscription = await sns.addSubscription(
          userUuid,
          eventType.sns_topic_arn,
          endpoint.url
        );
        await db.addSubscription(
          endpoint.id,
          eventType.id,
          subscription.SubscriptionArn
        );
        return eventTypeName;
      } catch (error) {
        console.error(error);
      }
    })
  );
};

const createEndpoint = async (serviceUuid, userUuid, url, eventTypes) => {
  try {
    await validateUrl(url);
    await validateEventTypes(serviceUuid, eventTypes);
    const endpoint = await db.addEndpoint(userUuid, url);
    endpoint.eventTypes = [];
    await sns.addManualSubscription(endpoint);
    await subscribeToEventTypes(serviceUuid, eventTypes, endpoint, userUuid);
    const { id, ...returnableEndpoint } = endpoint;
    return newResponse(201, returnableEndpoint);
  } catch (error) {
    console.error(error);
    if (error.name === "InvalidArgumentError") {
      return newResponse(400, {
        error_type: error.name,
        detail: error.message,
      });
    } else {
      return newResponse(500, {
        error_type: "InternalError",
        detail: "Could not create subscription.",
      });
    }
  }
};

const deleteEndpoint = async (endpointUuid) => {
  try {
    await db.deleteEndpoint(endpointUuid);
    const deletedArns = await db.deleteSubscriptions(endpointUuid);
    deletedArns.push({ subscription_arn: process.env.RESEND_ARN });
    await sns.deleteSubscriptions(deletedArns);
    return newResponse(204, {});
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not delete subscription.",
    });
  }
};

const deleteSubscriptions = async (subscriptions) => {
  return await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await sns.deleteSubscription(subscription.subscription_arn);
        await db.deleteSubscription(subscription.subscription_arn);
        return subscription.name;
      } catch (error) {
        console.error(error);
      }
    })
  );
};

const getEndpoint = async (endpointUuid) => {
  try {
    const endpoint = await db.getEndpoint(endpointUuid);
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

const listEndpoints = async (userUuid) => {
  try {
    const endpoints = await db.listEndpoints(userUuid);
    return newResponse(200, endpoints);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get subscriptions.",
    });
  }
};

const subscribeToEventTypes = async (
  serviceUuid,
  eventTypes,
  endpoint,
  userUuid
) => {
  await Promise.all(
    eventTypes.map(async (eventTypeName) => {
      try {
        const eventType = await db.getEventType(serviceUuid, eventTypeName);
        const subscription = await sns.addSubscription(
          userUuid,
          eventType.sns_topic_arn,
          endpoint.url
        );
        console.log("Subscription: ", subscription);
        await db.addSubscription(
          endpoint.id,
          eventType.id,
          subscription.SubscriptionArn
        );
        endpoint.eventTypes.push(eventTypeName);
      } catch (error) {
        console.error(error);
      }
    })
  );
};

const updateEndpoint = async (
  serviceUuid,
  endpointUuid,
  userUuid,
  eventTypes
) => {
  const endpoint = await db.getEndpoint(endpointUuid);
  if (!endpoint) {
    return newResponse(404, {
      error_type: "data_not_found",
      detail: "No subscription matches given uuid.",
    });
  }

  try {
    await validateEventTypes(eventTypes);
    const subscriptions = await db.getSubscriptions(endpoint.uuid);
    const { toDelete, toAdd } = extractChanges(subscriptions, eventTypes);
    const deleted = await deleteSubscriptions(toDelete);
    const added = await addSubscriptions(
      serviceUuid,
      toAdd,
      endpoint,
      userUuid
    );
    const updatedEndpoint = formatEndpoint(
      endpoint,
      subscriptions,
      deleted,
      added
    );
    return newResponse(202, updatedEndpoint);
  } catch (error) {
    console.error(error);
    if (error.name === "InvalidArgumentError") {
      return newResponse(500, {
        error_type: error.name,
        detail: error.message,
      });
    } else {
      return newResponse(500, {
        error_type: "process_failed",
        detail: "Could not update subscription.",
      });
    }
  }
};

module.exports = {
  createEndpoint,
  deleteEndpoint,
  getEndpoint,
  listEndpoints,
  updateEndpoint,
};
