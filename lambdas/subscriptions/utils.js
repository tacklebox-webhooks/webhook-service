const db = require("./db");
const { InvalidArgumentError } = require("./error");
const VALID_UUID = /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i;

const extractChanges = (subscriptions, event_types) => {
  const toDelete = subscriptions.filter(
    (subscription) => !event_types.includes(subscription.name)
  );
  const toAdd = event_types.filter((event_type) => {
    return !subscriptions.find((subscription) => {
      return subscription.name === event_type;
    });
  });

  return { toDelete, toAdd };
};

const formatEndpoint = (endpoint, subscriptions, deleted, added) => {
  subscriptions = subscriptions.map((subscription) => subscription.name);
  subscriptions = subscriptions.filter(
    (subscription) => !deleted.includes(subscription)
  );
  subscriptions = [...subscriptions, ...added];

  return {
    uuid: endpoint.uuid,
    url: endpoint.url,
    created_at: endpoint.created_at,
    eventTypes: subscriptions,
  };
};

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

const validateEventTypes = async (serviceUuid, names) => {
  if (!names || names.length === 0) {
    throw new InvalidArgumentError(
      `A non-empty 'eventTypes' list must be included`
    );
  }
  await Promise.all(
    names.map(async (name) => {
      const eventType = await db.getEventType(serviceUuid, name);
      if (!eventType) {
        throw new InvalidArgumentError(`Event Type '${name}' does not exist`);
      }
    })
  );
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

const validateUrl = (url) => {
  if (!url) {
    throw new InvalidArgumentError(`A non-empty 'url' must be included`);
  }
};

const validateUser = async (userUuid) => {
  if (!VALID_UUID.test(userUuid)) {
    throw new InvalidArgumentError(`No user matches uuid '${userUuid}'`);
  }
  const user = db.getService(userUuid);
  if (!user) {
    throw new InvalidArgumentError(`No user matches uuid '${userUuid}'`);
  }
};

module.exports = {
  extractChanges,
  formatEndpoint,
  newResponse,
  validateEventTypes,
  validateService,
  validateUrl,
  validateUser,
};
