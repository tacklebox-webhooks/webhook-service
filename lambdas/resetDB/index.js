const { db } = require("./db");
const fs = require("fs");

const newResponse = (statusCode, body) => {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
};

const handler = async () => {
  const schemaString = fs.readFileSync("./db.sql", "utf8");

  try {
    const response = await db.query(schemaString);
    console.log(response.rows);
    return newResponse(200, response.rows);
  } catch (error) {
    console.error(error);
  }
};

exports.handler = handler;
