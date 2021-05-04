"use strict";
const {
  deleteEndpoint,
  getEndpoint,
  createEndpoint,
  listEndpoints,
} = require("./endpointActions");

exports.handler = async (event) => {
  let {
    pathParameters,
    httpMethod,
    body,
    // headers
  } = event;

  body = JSON.parse(body);
  const serviceId = pathParameters ? pathParameters.service_id : undefined;
  const userId = pathParameters ? pathParameters.user_id : undefined;
  const endpointId = pathParameters
    ? pathParameters.subscription_id
    : undefined;

  if (endpointId) {
    switch (httpMethod) {
      case "DELETE":
        console.log("DELETE");
        return await deleteEndpoint(endpointId);
      case "GET":
        console.log("GET EVENT");
        return await getEndpoint(endpointId);
    }
  } else {
    switch (httpMethod) {
      case "POST":
        console.log("POST");
        return await createEndpoint(userId, body.url, body.eventTypes);
      case "GET":
        console.log("LIST EVENTS");
        return await listEndpoints(userId);
    }
  }
};

// Create New Endpoint
// Input: ServiceId, UserId, url, array of event types
// {url: https://myEndpoint.com, eventTypes: [todo_created, todo_updated]}
// eventTypes: [event_type_uuid, event_type_uuid]

// 1. Create endpoint in DB (url, userId)
// 2. Iterate through eventTypes array
// For each eventType, map uuid to id
// Contact SNS to subscribe endpoint URL to the associated topic
// Take returned subscription ARN, save to DB
