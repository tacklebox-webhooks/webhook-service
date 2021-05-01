'use strict';
const {
  deleteService,
  getService,
  createService,
  listServices
} = require('./serviceActions');

exports.handler = async (event) => {
  let {
    pathParameters,
    httpMethod,
    body,
    // headers
  } = event;
  body = JSON.parse(body);
  const serviceId = pathParameters ? pathParameters.service_id : undefined;
  
  if (serviceId) {
    switch (httpMethod) {
      case 'DELETE':
        console.log('DELETE');
        return await deleteService(serviceId);
      case 'GET':
        console.log('GET');
        return await getService(serviceId);
    }
  } else {
    switch (httpMethod) {
      case 'POST':
        console.log('POST');
        return await createService(body.name);
      case 'GET':
        console.log('GET');
        return await listServices();
    }
  }
};