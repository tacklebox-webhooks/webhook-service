"use strict";
const {
  deleteUser,
  getUser,
  createUser,
  listUsers,
} = require("./serviceActions");

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

  if (userId) {
    switch (httpMethod) {
      case "DELETE":
        console.log("DELETE");
        return await deleteUser(userId);
      case "GET":
        console.log("GET");
        return await getUser(userId);
    }
  } else {
    switch (httpMethod) {
      case "POST":
        console.log("POST");
        return await createUser(body.name, serviceId);
      case "GET":
        console.log("GET");
        return await listUsers(serviceId);
    }
  }
};
