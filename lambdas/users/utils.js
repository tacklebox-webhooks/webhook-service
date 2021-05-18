const db = require("./db");
const { InvalidArgumentError } = require("./error");
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

const validateService = async (serviceUuid) => {
  if (!VALID_UUID.test(serviceUuid)) {
    throw new InvalidArgumentError(`No service matches uuid '${serviceUuid}'`);
  }
  const service = db.getService(serviceUuid);
  if (!service) {
    throw new InvalidArgumentError(`No service matches uuid '${serviceUuid}'`);
  }
};

module.exports = {
  newResponse,
  validateService,
};
