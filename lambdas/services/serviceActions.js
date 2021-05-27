const db = require("./db");
const sns = require("./sns");
const { newResponse } = require("./utils");

const createService = async (name) => {
  if (!name) {
    return newResponse(400, {
      error_type: "invalid_parameter",
      detail: "'name' is required.",
    });
  }

  const service = await db.createService(name);
  return newResponse(201, service);
};

const deleteService = async (service) => {
  const deletedService = await db.deleteService(service.uuid);
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
};

const getService = async (service) => {
  return newResponse(200, service);
};

const listServices = async () => {
  const services = await db.listServices();
  return newResponse(200, services);
};

const deleteEventTypes = async (serviceId) => {
  const eventTypesToDelete = await db.getEventTypes(serviceId);
  await sns.deleteEventTypes(eventTypesToDelete);
  await db.deleteEventTypes(serviceId);
};

const deleteSubscriptions = async (serviceId) => {
  const subscriptionsToDelete = await db.getSubscriptions(serviceId);
  await sns.deleteSubscriptions(subscriptionsToDelete);
  await db.deleteSubscriptions(serviceId);
};

module.exports = {
  deleteService,
  getService,
  createService,
  listServices,
};
