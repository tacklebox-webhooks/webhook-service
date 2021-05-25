const db = require("./db");
const { newResponse, isValidUuid } = require("./utils");

const getStats = async (serviceUuid) => {
  if (!isValidUuid(serviceUuid)) {
    return newResponse(404, {
      error_Type: "data_not_found",
      detail: "No service matches given uuid.",
    });
  }

  try {
    const serviceId = await db.uuidToId("services", serviceUuid);
    const endpoints = await db.getEndpointCount(serviceId);
    const events = await db.getEvents(serviceId);
    const messages = await db.getMessages(serviceId);
    const users = await db.getUserCount(serviceId);

    const eventsByEndpoint = getEventsByEndpoint(events);
    const eventsByType = getEventsByType(events);
    const failedMessages = getFailedMessageCount(messages);
    const messagesByMonth = getMessagesByMonth(messages);
    const messagesByStatus = getMessagesByStatus(messages);

    const counts = {
      endpoints,
      events: events.length,
      eventsByEndpoint,
      eventsByType,
      failedMessages,
      messages: messages.length,
      messagesByMonth,
      messagesByStatus,
      users,
    };

    return newResponse(200, counts);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get service.",
    });
  }
};

const getEventsByEndpoint = (events) => {
  const counts = {};
  events.forEach((event) => {
    if (!counts[event.endpoint]) {
      counts[event.endpoint] = 0;
    }
    counts[event.endpoint] += 1;
  });
  return counts;
};

const getEventsByType = (events) => {
  const counts = {};
  events.forEach((event) => {
    if (!counts[event.type]) {
      counts[event.type] = 0;
    }
    counts[event.type] += 1;
  });
  return counts;
};

const getFailedMessageCount = (messages) => {
  const deliveryStatuses = messages.map((message) =>
    message.delivered ? 0 : 1
  );
  return deliveryStatuses.reduce((sum, curr) => sum + curr, 0);
};

const getMessagesByMonth = (messages) => {
  const byMonth = {};
  messages.forEach((message) => {
    const d = new Date(message.created_at);
    const month = d.getMonth();
    if (!byMonth[month]) {
      byMonth[month] = 0;
    }
    byMonth[month] += 1;
  });
  return byMonth;
};

const getMessagesByStatus = (messages) => {
  const counts = {};
  messages.forEach((event) => {
    if (!counts[event.status_code]) {
      counts[event.status_code] = 0;
    }
    counts[event.status_code] += 1;
  });
  return counts;
};

module.exports = {
  getStats,
};
