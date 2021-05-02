"use strict";
const { getMessage, resendMessage, listMessages } = require("./messageActions");

exports.handler = async (event) => {
  let { pathParameters, httpMethod, resource } = event;
  const serviceId = pathParameters ? pathParameters.service_id : pathParameters;
  const userId = pathParameters ? pathParameters.user_id : pathParameters;
  const messageId = pathParameters ? pathParameters.message_id : pathParameters;
  const isResend =
    resource ===
    "/services/{service_id}/users/{user_id}/messages/{message_id}/resend";

  // do we need to validate whether serviceId and userId are valid here?

  if (isResend && httpMethod === "POST") {
    console.log("Resending message");
    return await resendMessage(messageId);
  } else if (messageId && httpMethod === "GET") {
    console.log("Getting message");
    return await getMessage(messageId);
  } else if (httpMethod === "GET") {
    console.log("Listing all messages for user");
    return await listMessages(userId);
  }
};
