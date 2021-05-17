"use strict";
const { newResponse, validateService, validateUser } = require("./utils");
const {
  createEndpoint,
  deleteEndpoint,
  getEndpoint,
  listEndpoints,
  updateEndpoint,
} = require("./endpointActions");

exports.handler = async (event) => {
  let { pathParameters, httpMethod, body } = event;
  body = JSON.parse(body);
  const endpointUuid = pathParameters && pathParameters.subscription_id;
  const serviceUuid = pathParameters && pathParameters.service_id;
  const userUuid = pathParameters && pathParameters.user_id;

  try {
    await validateUser(userUuid);
    await validateService(serviceUuid);

    if (endpointUuid) {
      switch (httpMethod) {
        case "DELETE":
          return await deleteEndpoint(endpointUuid);
        case "GET":
          return await getEndpoint(endpointUuid);
        case "PUT":
          return await updateEndpoint(
            serviceUuid,
            endpointUuid,
            userUuid,
            body.eventTypes
          );
      }
    } else {
      switch (httpMethod) {
        case "POST":
          return await createEndpoint(
            serviceUuid,
            userUuid,
            body.url,
            body.eventTypes
          );
        case "GET":
          return await listEndpoints(userUuid);
      }
    }
  } catch (error) {
    console.error(error);
    if (error.name === "InvalidArgumentError") {
      return newResponse(404, {
        error_Type: error.name,
        detail: error.message,
      });
    } else {
      return newResponse(500, {
        error_Type: error.name,
        detail: error.message,
      });
    }
  }
};
