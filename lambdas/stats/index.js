"use strict";
const { getStats } = require("./statActions");

exports.handler = async (event) => {
  let { pathParameters } = event;
  const serviceUuid = pathParameters
    ? pathParameters.service_id
    : pathParameters;

  if (serviceUuid) {
    return await getStats(serviceUuid);
  }
};
