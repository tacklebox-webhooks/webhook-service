'use strict';

const { format } = require('date-and-time');
const { v1: uuid } = require('uuid');
const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB();

exports.handler = async (event) => {
  let {
    resource,
    httpMethod,
    body,
    // headers
  } = event;
  body = JSON.parse(body);
  const {
    name
  } = body;
  
  if (httpMethod === 'POST') {
    const table = resource.slice(1);
    const scanParams = {
      TableName: table
    };
    
    try {
      const result = await ddb.scan(scanParams).promise();
      let { Items: services } = result;
      services = services.map(service => {
        const name = service['serviceName']['S'];
        return name;
      });

      if (services.includes(name)) {
        return;
      } else {
        const id = uuid();
        const now = new Date();
        const createdAt = format(now, 'MM-DD-YYYYTHH:mm:ss.SSS', true);
        const putParams = {
          Item: {
            id: {
              "S": id
            },
            serviceName: {
              "S": name
            },
            createdAt: {
              "S": createdAt
            }
          },
          ConditionExpression: "id <> :id",
          ExpressionAttributeValues: {
            ":id": { "S": id }
          },
          TableName: table
        };
  
        await ddb.putItem(putParams).promise();
        const success = `The service id for ${name} is ==> ${id} <==`;
        let responseBody = {
          success
        };
        responseBody = JSON.stringify(responseBody);
        const response = {
          statusCode: 200,
          body: responseBody,
        };
      
        return response;
      }
    } catch (err) {
      console.error(err);
    }
  }
};