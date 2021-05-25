"use strict";
const { getStats, testFunction } = require("./statActions");

exports.handler = async (event) => {
  let { pathParameters } = event;
  const serviceUuid = pathParameters && pathParameters.service_id;

  if (serviceUuid) {
    return await getStats(serviceUuid);
  }
};
