const { db } = require("./db");

const serviceUuidToPK = async (uuid) => {
  const text = "SELECT id FROM services WHERE uuid = $1";
  const values = [uuid];

  const response = await db.query(text, values);
  let responseBody = response.rows[0];
  return responseBody.id;
};

const createUser = async (name, serviceId) => {
  let serviceIdPk;

  try {
    serviceIdPk = await serviceUuidToPK(serviceId);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not create user" });
  }

  const text =
    "INSERT INTO users(name, service_id) VALUES($1, $2) RETURNING uuid, name, created_at";
  const values = [name, serviceIdPk];

  try {
    const response = await db.query(text, values);
    let responseBody = response.rows[0];
    return newResponse(201, responseBody);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not create user" });
  }
};

const listUsers = async (serviceId) => {
  const serviceIdPk = await serviceUuidToPK(serviceId);
  const text =
    "SELECT uuid, name, created_at FROM users WHERE deleted_at IS NULL AND service_id = $1";
  const values = [serviceIdPk];

  try {
    const response = await db.query(text, values);
    let responseBody = response.rows;
    return newResponse(200, responseBody);
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not get users" });
  }
};

const getUser = async (userId) => {
  console.log("Getting user");

  const text =
    "SELECT uuid, name, created_at FROM users WHERE uuid = $1 AND deleted_at IS NULL";
  const values = [userId];

  try {
    const response = await db.query(text, values);
    if (response.rows.length === 0) {
      return newResponse(404, { Error: "User not found" });
    } else {
      let responseBody = response.rows[0];
      return newResponse(200, responseBody);
    }
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not get user" });
  }
};

const deleteUser = async (userId) => {
  const text =
    "UPDATE users SET deleted_at = NOW() WHERE uuid = $1 AND deleted_at IS NULL RETURNING uuid";
  const values = [userId];

  try {
    // all need to delete related subscriptions
    const response = await db.query(text, values);
    if (response.rows.length === 0) {
      return newResponse(404, { Error: "User not found" });
    } else {
      return newResponse(204, { Success: "User was deleted" });
    }
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not delete user" });
  }
};

const newResponse = (statusCode, body) => {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
};

module.exports = {
  deleteUser,
  getUser,
  createUser,
  listUsers,
};
