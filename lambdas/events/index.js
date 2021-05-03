"use strict";
const { getEvent, createEvent, listEvents } = require("./eventActions");

exports.handler = async (event) => {
  console.log(event);
  let { pathParameters, httpMethod, resource, body } = event;
  body = JSON.parse(body);
  const serviceUuid = pathParameters
    ? pathParameters.service_id
    : pathParameters;
  const userUuid = pathParameters ? pathParameters.user_id : pathParameters;
  const eventUuid = pathParameters ? pathParameters.event_id : pathParameters;
  console.log(serviceUuid, userUuid, eventUuid, body);

  // do we need to validate whether serviceId and userId are valid here?

  // if (isResend && httpMethod === 'POST') {
  //   console.log('Resending message');
  //   return await resendMessage(messageUuid);
  // } else if (messageUuid && httpMethod === 'GET') {
  //   console.log('Getting message');
  //   return await getMessage(messageUuid);
  // } else if (httpMethod === 'GET') {
  //   console.log('Listing all messages for user');
  //   return await listMessages(userUuid);
  // }
};
