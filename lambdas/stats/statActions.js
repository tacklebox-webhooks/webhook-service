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
    const eventsByType = await db.getEventsByType(serviceId);
    const eventsByUser = await db.getEventsByUser(serviceId);
    const messages = await db.getMessages(serviceId);
    const messagesByDay = await db.getMessagesByDay(serviceId);
    const messagesByMonth = await db.getMessagesByMonth(serviceId);
    const users = await db.getUserCount(serviceId);

    const failedMessages = getFailedMessageCount(messages);
    const messagesByStatus = getMessagesByStatus(messages);

    const counts = {
      endpoints,
      events: {
        byType: eventsByType,
        byUser: eventsByUser,
        total: events,
      },
      messages: {
        byDay: messagesByDay,
        byMonth: messagesByMonth,
        byStatus: messagesByStatus,
        failed: failedMessages,
        total: messages.length,
      },
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

const getFailedMessageCount = (messages) => {
  const deliveryStatuses = messages.map((message) =>
    message.delivered ? 0 : 1
  );
  return deliveryStatuses.reduce((sum, curr) => sum + curr, 0);
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
