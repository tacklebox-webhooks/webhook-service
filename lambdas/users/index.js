"use strict";
const { newResponse, validateService } = require("./utils");
const { createUser, deleteUser, getUser, listUsers } = require("./userActions");

exports.handler = async (event) => {
  let { pathParameters, httpMethod, body } = event;
  body = JSON.parse(body);
  const userUuid = pathParameters && pathParameters.user_id;
  const serviceUuid = pathParameters && pathParameters.service_id;

  try {
    await validateService(serviceUuid);

    if (userUuid) {
      switch (httpMethod) {
        case "DELETE":
          return await deleteUser(userUuid);
        case "GET":
          return await getUser(userUuid);
      }
    } else {
      switch (httpMethod) {
        case "POST":
          return await createUser(body.name, serviceUuid);
        case "GET":
          return await listUsers(serviceUuid);
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
