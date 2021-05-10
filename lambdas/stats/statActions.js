const { db, queries } = require("./db");
const { newResponse, isValidUuid, uuidToId } = require("./utils");

const getStats = async (serviceUuid) => {
  if (!isValidUuid(serviceUuid)) {
    return newResponse(404, {
      error_Type: "data_not_found",
      detail: "No service matches given uuid.",
    });
  }

  try {
    const serviceId = await uuidToId("services", serviceUuid);
    const values = [serviceId];

    const usersResponse = await db.query(queries.countUsers, values);
    const endpointsResponse = await db.query(queries.countEndpoints, values);
    const eventsResponse = await db.query(queries.countEvents, values);
    const messagesResponse = await db.query(queries.countMessages, values);

    const users = usersResponse.rows[0].count;
    const endpoints = endpointsResponse.rows[0].count;
    const events = eventsResponse.rows[0].count;
    const messages = messagesResponse.rows[0].count;

    const counts = {
      users,
      endpoints,
      events,
      messages,
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

module.exports = {
  getStats,
};
