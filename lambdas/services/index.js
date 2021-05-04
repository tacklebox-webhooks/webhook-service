"use strict";
const { getService, createService, listServices } = require("./serviceActions");

exports.handler = async (event) => {
  let { pathParameters, httpMethod, body } = event;
  body = JSON.parse(body);
  const serviceId = pathParameters ? pathParameters.service_id : pathParameters;

  if (serviceId) {
    switch (httpMethod) {
      // case 'DELETE':
      //   return await deleteService(serviceId);
      case "GET":
        return await getService(serviceId);
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
