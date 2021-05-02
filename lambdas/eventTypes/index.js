"use strict";
const {
  deleteEventType,
  getEventType,
  createEventType,
  listEventTypes,
} = require("./eventTypeActions");

exports.handler = async (event) => {
  let {
    pathParameters,
    httpMethod,
    body,
    // headers
  } = event;

  body = JSON.parse(body);
  const serviceId = pathParameters ? pathParameters.service_id : undefined;
  const eventTypeId = pathParameters ? pathParameters.event_type_id : undefined;

  if (eventTypeId) {
    switch (httpMethod) {
      case "DELETE":
        console.log("DELETE");
        return await deleteEventType(serviceId, eventTypeId);
      case "GET":
        console.log("GET EVENT");
        return await getEventType(eventTypeId);
    }
  } else {
    switch (httpMethod) {
      case "POST":
        console.log("POST");
        return await createEventType(body.name, serviceId);
      case "GET":
        console.log("LIST EVENTS");
        return await listEventTypes(serviceId);
    }
  }
};
