"use strict";
const { getMessage, resendMessage, listMessages } = require("./messageActions");

exports.handler = async (event) => {
  let { pathParameters, httpMethod, resource } = event;
  const serviceUuid = pathParameters
    ? pathParameters.service_id
    : pathParameters;
  const userUuid = pathParameters ? pathParameters.user_id : pathParameters;
  const messageUuid = pathParameters
    ? pathParameters.message_id
    : pathParameters;
  const isResend =
    resource ===
    "/services/{service_id}/users/{user_id}/messages/{message_id}/resend";

  // do we need to validate whether serviceId and userId are valid here?

  if (isResend && httpMethod === "POST") {
    console.log("Resending message");
    return await resendMessage(messageUuid);
  } else if (messageUuid && httpMethod === "GET") {
    console.log("Getting message");
    return await getMessage(messageUuid);
  } else if (httpMethod === "GET") {
    console.log("Listing all messages for user");
    return await listMessages(userUuid);
  }
};
