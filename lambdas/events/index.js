"use strict";
const { getEvent, createEvent, listEvents } = require("./eventActions");

exports.handler = async (event) => {
  let { pathParameters, httpMethod, resource, body } = event;
  body = JSON.parse(body);
  const serviceUuid = pathParameters
    ? pathParameters.service_id
    : pathParameters;
  const userUuid = pathParameters ? pathParameters.user_id : pathParameters;
  const eventUuid = pathParameters ? pathParameters.event_id : pathParameters;

  // do we need to validate whether serviceId and userId are valid here?

  if (eventUuid && httpMethod === "GET") {
    console.log("Getting event");
    return await getEvent(eventUuid);
  } else if (httpMethod === "POST") {
    console.log("Creating event");
    return await createEvent(userUuid, body);
  } else if (httpMethod === "GET") {
    console.log("Listing all events for user");
    return await listEvents(userUuid);
  }
};
