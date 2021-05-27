"use strict";
const { newResponse, isValidUuid } = require("./utils");
const db = require("./db");
const {
  deleteService,
  getService,
  createService,
  listServices,
} = require("./serviceActions");

exports.handler = async (event) => {
  let { pathParameters, httpMethod, body } = event;
  body = JSON.parse(body);
  const serviceUuid = pathParameters && pathParameters.service_id;

  try {
    if (serviceUuid) {
      return handleRoutesWithServiceUuid(httpMethod, serviceUuid);
    } else {
      return handleRoutesWithoutServiceUuid(httpMethod, body);
    }
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Operation failed",
    });
  }
};

const handleRoutesWithServiceUuid = async (httpMethod, serviceUuid) => {
  if (!isValidUuid(serviceUuid)) {
    return newResponse(404, {
      error_type: "invalid_parameter",
      detail: "Service not found",
    });
  }

  const service = await db.getService(serviceUuid);
  if (!service) {
    return newResponse(404, {
      error_type: "invalid_parameter",
      detail: "Service not found",
    });
  }

  switch (httpMethod) {
    case "DELETE":
      return await deleteService(service);
    case "GET":
      return await getService(service);
  }
};

const handleRoutesWithoutServiceUuid = async (httpMethod, body) => {
  switch (httpMethod) {
    case "POST":
      return await createService(body.name);
    case "GET":
      return await listServices();
  }
};
