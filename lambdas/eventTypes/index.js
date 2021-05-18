"use strict";
const {
  deleteEventType,
  getEventType,
  createEventType,
  listEventTypes,
} = require("./eventTypeActions");
const { newResponse, isValidService } = require("./utils");

exports.handler = async (event) => {
  let { pathParameters, httpMethod, body } = event;
  body = JSON.parse(body);
  const eventTypeUuid = pathParameters && pathParameters.event_type_id;
  const serviceUuid = pathParameters && pathParameters.service_id;

  if (!(await isValidService(serviceUuid))) {
    return newResponse(404, {
      error_Type: "data_not_found",
      detail: "No service matches given uuid.",
    });
  }

  if (eventTypeUuid) {
    switch (httpMethod) {
      case "DELETE":
        return await deleteEventType(eventTypeUuid);
      case "GET":
        return await getEventType(eventTypeUuid);
    }
  } else {
    switch (httpMethod) {
      case "POST":
        return await createEventType(
          body.name,
          serviceUuid,
          event.requestContext.accountId
        );
      case "GET":
        return await listEventTypes(serviceUuid);
    }
  }
};
