const db = require("./db");
const sns = require("./sns");
const { newResponse, isValidUuid } = require("./utils");

const createService = async (name) => {
  if (!name) {
    return newResponse(400, {
      error_type: "invalid_parameter",
      detail: "'name' is required.",
    });
  }

  try {
    const service = await db.createService(name);
    return newResponse(201, service);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not create service.",
    });
  }
};

const deleteEventTypes = async (serviceUuid) => {
  const eventTypesToDelete = await db.getEventTypes(serviceUuid);
  await sns.deleteEventTypes(eventTypesToDelete);
  await db.deleteEventTypes(serviceUuid);
};

const deleteService = async (serviceUuid) => {
  try {
    const deletedService = await db.deleteService(serviceUuid);
    if (!deletedService) {
      return newResponse(404, {
        error_type: "invalid_parameter",
        detail: "Service not found",
      });
    }
    await deleteSubscriptions(deletedService.id);
    await db.deleteEndpoints(deletedService.id);
    await db.deleteUsers(deletedService.id);
    await deleteEventTypes(deletedService.id);
    return newResponse(204, {});
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not delete service" });
  }
};

const deleteSubscriptions = async (serviceId) => {
  const subscriptionsToDelete = await db.getSubscriptions(serviceId);
  await sns.deleteSubscriptions(subscriptionsToDelete);
  await db.deleteSubscriptions(serviceId);
};

const getService = async (serviceUuid) => {
  if (!isValidUuid(serviceUuid)) {
    return newResponse(404, {
      error_Type: "data_not_found",
      detail: "No service matches given uuid.",
    });
  }

  try {
    const service = await db.getService(serviceUuid);
    if (!service) {
      return newResponse(404, {
        error_type: "data_not_found",
        detail: "No service matches given uuid.",
      });
    }

    return newResponse(200, service);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get service.",
    });
  }
};

const listServices = async () => {
  try {
    const services = await db.listServices();
    return newResponse(200, services);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get services.",
    });
  }
};

module.exports = {
  deleteService,
  getService,
  createService,
  listServices,
};
