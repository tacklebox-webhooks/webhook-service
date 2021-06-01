'use strict';
const { getStats, getEventTypes, getSubscriptions } = require('./statActions');
const { newResponse, isValidUuid } = require('./utils');
const db = require('./db');

exports.handler = async (event) => {
  let { pathParameters, queryStringParameters: params } = event;
  const serviceUuid = pathParameters && pathParameters.service_id;
  const userUuid = params && params.user;
  console.log(params);
  if (!isValidUuid(serviceUuid)) {
    return newResponse(404, {
      error_type: 'invalid_parameter',
      detail: 'Service uuid is not a valid uuid',
    });
  }

  if (userUuid && !isValidUuid(userUuid)) {
    return newResponse(404, {
      error_type: 'invalid_parameter',
      detail: 'User uuid is not a valid uuid',
    });
  }

  try {
    const service = await db.getService(serviceUuid);
    if (!service) {
      return newResponse(404, {
        error_type: 'invalid_parameter',
        detail: 'Service not found',
      });
    }

    if (userUuid) {
      const user = await db.getUser(service.id, userUuid);
      if (!user) {
        return newResponse(404, {
          error_type: 'invalid_parameter',
          detail: 'User not found',
        });
      }

      switch (params.type) {
        case 'subscriptions':
          return await getSubscriptions(user.id);
      }
    }

    if (!params) {
      return await getStats(service.id);
    }

    switch (params.type) {
      case 'event_type':
        return await getEventTypes(service.id);
    }
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: 'process_failed',
      detail: 'Operation failed',
    });
  }
};
