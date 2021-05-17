const db = require("./db");

const VALID_UUID = /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i;

const newResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: JSON.stringify(body),
  };
};

const isValidService = async (serviceUuid) => {
  if (!VALID_UUID.test(serviceUuid)) {
    return false;
  }

  const service = await db.getService(serviceUuid);
  return !!service;
};

const isValidEventTypeName = (name) => {
  const eventTypeNameRegex = /^[a-z0-9-_]{1,50}$/i;
  return eventTypeNameRegex.test(name);
};

module.exports.newResponse = newResponse;
module.exports.isValidService = isValidService;
module.exports.isValidEventTypeName = isValidEventTypeName;
