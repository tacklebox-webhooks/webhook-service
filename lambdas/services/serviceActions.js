const { db } = require('./db');

const createService = async (name) => {
  const text = 'INSERT INTO services(name) VALUES($1) RETURNING uuid, name, created_at';
  const values = [name];

  try {
    const response = await db.query(text, values);
    let responseBody = response.rows[0];
    return newResponse(201, responseBody);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: 'Could not create service' });
  }
};

const listServices = async () => {
  const queryString = 'SELECT uuid, name, created_at FROM services WHERE deleted_at IS NULL';

  try {
    const response = await db.query(queryString);
    let responseBody = response.rows;
    return newResponse(200, responseBody);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: 'Could not get services' });
  }
};

const getService = async (serviceId) => {
  const text = 'SELECT uuid, name, created_at FROM services WHERE uuid = $1 AND deleted_at IS NULL';
  const values = [serviceId];

  try {
    const response = await db.query(text, values);
    if (response.rows.length === 0) {
      return newResponse(404, { Error: 'Service not found'});
    } else {
      let responseBody = response.rows[0];
      return newResponse(200, responseBody);
    }
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: 'Could not get service' });
  }
};

const deleteService = async (serviceId) => {
  const text = "UPDATE services SET deleted_at = NOW() WHERE uuid = $1 AND deleted_at IS NULL RETURNING uuid";
  const values = [serviceId];

  try {
    // all need to delete related topics
    const response = await db.query(text, values);
    if (response.rows.length === 0) {
      return newResponse(404, { Error: 'Service not found'});
    } else {
      return newResponse(204, { Success: 'Service was deleted'});
    }
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: 'Could not delete service' });
  }
};

const newResponse = (statusCode, body) => {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
};

module.exports = {
  deleteService,
  getService,
  createService,
  listServices
};