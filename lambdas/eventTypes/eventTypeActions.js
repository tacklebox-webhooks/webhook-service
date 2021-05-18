const sns = require("./sns");
const db = require("./db");
const { newResponse, isValidEventTypeName } = require("./utils");

const createEventType = async (name, serviceUuid, accountId) => {
  if (!name) {
    return newResponse(400, {
      error_type: "missing_parameter",
      detail: "'name' is required.",
    });
  } else if (!isValidEventTypeName(name)) {
    return newResponse(400, {
      error_type: "invalid_parameter",
      detail:
        "'name' is limited to 50 characters, and can contain alphanumeric characters, hyphens, and underscores.",
    });
  }

  try {
    const serviceId = await db.uuidToId("services", serviceUuid);
    const eventTypeArn = await sns.createEventType(
      serviceUuid,
      serviceId,
      name,
      accountId
    );
    const eventType = await db.createEventType(name, serviceId, eventTypeArn);
    return newResponse(201, eventType);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not create event type.",
    });
  }
};

const deleteEventType = async (eventTypeUuid) => {
  try {
    const deletedEventType = await db.deleteEventType(eventTypeUuid);
    if (!deletedEventType) {
      return newResponse(404, {
        error_type: "data_not_found",
        detail: "No event type matches given uuid.",
      });
    }
    await deleteSubscriptions(deletedEventType.id);
    await sns.deleteEventType(deletedEventType.sns_topic_arn);
    return newResponse(204, {});
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not delete event type.",
    });
  }
};

const deleteSubscriptions = async (eventTypeId) => {
  const subscriptionsToDelete = await db.getSubscriptions(eventTypeId);
  await sns.deleteSubscriptions(subscriptionsToDelete);
  await db.deleteSubscriptions(eventTypeId);
};

const getEventType = async (eventTypeUuid) => {
  try {
    const eventType = await db.getEventType(eventTypeUuid);
    if (!eventType) {
      return newResponse(404, {
        error_type: "data_not_found",
        detail: "No event type matches given uuid.",
      });
    }
    const topic = await sns.getEventType(eventType.sns_topic_arn);
    eventType.delivery_policy = JSON.parse(
      topic.Attributes.EffectiveDeliveryPolicy
    );
    const { sns_topic_arn, ...formattedEventType } = eventType;
    return newResponse(200, formattedEventType);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get event type.",
    });
  }
};

const listEventTypes = async (serviceUuid) => {
  try {
    let eventTypes = await db.listEventTypes(serviceUuid);
    return newResponse(200, eventTypes);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get event types.",
    });
  }
};

module.exports = {
  deleteEventType,
  getEventType,
  createEventType,
  listEventTypes,
};
