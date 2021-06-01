const db = require('./db');
const { newResponse } = require('./utils');

const getStats = async (serviceId) => {
  const firstMessageDate = await db.getFirstMessageDate(serviceId);
  // Simple count queries
  const endpointCount = await db.getEndpointCount(serviceId);
  const eventCount = await db.getEventCount(serviceId);
  const failedMessageCount = await db.getFailedMessageCount(serviceId);
  const messageCount = await db.getMessageCount(serviceId);
  const userCount = await db.getUserCount(serviceId);
  // Compound count queries
  const eventsByType = await db.getEventsByType(serviceId);
  const eventsByUser = await db.getEventsByUser(serviceId);
  const messagesByDay = await db.getMessagesByDay(serviceId);
  const messagesByMonth = await db.getMessagesByMonth(serviceId);
  const messagesByStatus = await db.getMessagesByStatus(serviceId);
  const messagesByYear = await db.getMessagesByYear(serviceId);
  const subscriptions = await getSubscriptions(serviceId);

  const counts = {
    endpoints: endpointCount,
    events: {
      byType: eventsByType,
      byUser: eventsByUser,
      total: eventCount,
    },
    messages: {
      byDay: messagesByDay,
      byMonth: messagesByMonth,
      byStatus: messagesByStatus,
      byYear: messagesByYear,
      failed: failedMessageCount,
      first: firstMessageDate,
      total: messageCount,
    },
    subscriptions,
    users: userCount,
  };

  return newResponse(200, counts);
};

const getEventTypes = async (serviceId) => {
  const eventTypes = await db.getEventTypes(serviceId);
  return newResponse(200, eventTypes);
};

const getSubscriptions = async (userId) => {
  let subscriptions = await db.getEventTypeCountByEndpoint(userId);
  const messageCounts = await db.getMessageCountByEndpoint(userId);
  subscriptions = subscriptions.map((subscription) => {
    subscription['failure_rate'] = 0.0;
    const counts = messageCounts[subscription.url];
    if (counts) {
      const { all, failed } = counts;
      const failureRate = failed / all;
      subscription['failure_rate'] = failureRate;
    }
    return subscription;
  });

  return newResponse(200, subscriptions);
};

const getEvents = async (userId) => {
  const events = await db.getEventsWithMessageCount(userId);
  return newResponse(200, events);
};

module.exports = {
  getStats,
  getEvents,
  getEventTypes,
  getSubscriptions,
};
