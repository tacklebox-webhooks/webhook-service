"use strict";
const {
  deleteService,
  getService,
  createService,
  listServices,
} = require("./serviceActions");

exports.handler = async (event) => {
  let { pathParameters, httpMethod, body } = event;
  body = JSON.parse(body);
  const serviceUuid = pathParameters && pathParameters.service_id;

  if (serviceUuid) {
    switch (httpMethod) {
      case "DELETE":
        return await deleteService(serviceUuid);
      case "GET":
        return await getService(serviceUuid);
    }
  } else {
    switch (httpMethod) {
      case "POST":
        return await createService(body.name);
      case "GET":
        return await listServices();
    }
  }
};
