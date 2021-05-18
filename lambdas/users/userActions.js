const db = require("./db");
const sns = require("./sns");
const { newResponse } = require("./utils");

const createUser = async (name, serviceUuid) => {
  if (!name) {
    return newResponse(400, {
      error_type: "missing_parameter",
      detail: "'name' is required.",
    });
  }

  try {
    const user = await db.createUser(name, serviceUuid);
    return newResponse(201, user);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not create user.",
    });
  }
};

const deleteSubscriptions = async (userId) => {
  const subscriptionsToDelete = await db.getSubscriptions(userId);
  await sns.deleteSubscriptions(subscriptionsToDelete);
  await db.deleteSubscriptions(userId);
};

const deleteUser = async (userUuid) => {
  try {
    const deletedUser = await db.deleteUser(userUuid);
    await deleteSubscriptions(deletedUser.id);
    await db.deleteEndpoints(deletedUser.id);
    return newResponse(204, {});
  } catch (error) {
    console.error(error);
    return newResponse(500, { Error: "Could not delete user" });
  }
};

const getUser = async (userUuid) => {
  try {
    const user = await db.getUser(userUuid);
    if (!user) {
      return newResponse(404, {
        error_type: "data_not_found",
        detail: "No user matches given uuid.",
      });
    }
    return newResponse(200, user);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get user.",
    });
  }
};

const listUsers = async (serviceUuid) => {
  try {
    const users = await db.listUsers(serviceUuid);
    return newResponse(200, users);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get users.",
    });
  }
};

module.exports = {
  createUser,
  deleteUser,
  getUser,
  listUsers,
};
