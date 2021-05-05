const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });
const cwlogs = new AWS.CloudWatchLogs({ apiVersion: "2014-03-28" });
const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
const { db, queries } = require("./db");
const { newResponse, uuidToId } = require("./utils");

const createEventType = async (name, serviceUuid) => {
  if (!name) {
    return newResponse(400, {
      error_type: "missing_parameter",
      detail: "'name' is required.",
    });
  }

  const serviceId = await uuidToId("services", serviceUuid);
  const snsTopicName = `CaptainHook_${serviceUuid}_${name}`;
  const HTTPSuccessFeedbackRoleArn =
    "arn:aws:iam::946221510390:role/SNSSuccessFeedback";
  const HTTPFailureFeedbackRoleArn =
    "arn:aws:iam::946221510390:role/SNSFailureFeedback";
  const HTTPSuccessFeedbackSampleRate = "100";

  const snsParams = {
    Name: snsTopicName,
    Attributes: {
      HTTPSuccessFeedbackRoleArn,
      HTTPFailureFeedbackRoleArn,
      HTTPSuccessFeedbackSampleRate,
    },
  };

  // CreateTopic is idempotent, so if topic with given name already
  // exists, it will return existing ARN.
  let TopicArn;

  try {
    const result = await sns.createTopic(snsParams).promise();
    TopicArn = result.TopicArn;
    console.log(result);
  } catch (error) {
    console.error(error);
  }

  // Create log groups for SNS to use

  // var logGroupName1 = `sns/us-east-2/169534841384/${Name}`;
  // var createLogGroupParams1 = {
  //   logGroupName: logGroupName1,
  // };
  // Dont delete below
  const region = "us-east-1";
  const accountId = "946221510390";
  const logGroupName = `sns/${region}/${accountId}/${snsTopicName}`;
  const logGroupNameFailure = `${logGroupName}/Failure`;
  const destinationArn = `arn:aws:lambda:${region}:${accountId}:function:CaptainHook_LogMessages`;

  try {
    await cwlogs.createLogGroup({ logGroupName: logGroupName }).promise();
    await cwlogs
      .createLogGroup({ logGroupName: logGroupNameFailure })
      .promise();
    // Add permissions to logMessage lambda
    const lambdaParams = {
      Action: "lambda:InvokeFunction",
      FunctionName: "CaptainHook_LogMessages",
      Principal: `logs.${region}.amazonaws.com`,
      SourceArn: `arn:aws:logs:${region}:${accountId}:log-group:${logGroupName}:*`,
      StatementId: `${snsTopicName}SuccessTrigger`,
    };

    const lambdaResult = await lambda.addPermission(lambdaParams).promise();
    console.log(lambdaResult);
    // Tell log group to invoke lambda
    const putSubscriptionFilterParams1 = {
      destinationArn,
      filterName: lambdaParams.StatementId,
      filterPattern: "",
      logGroupName,
    };

    const cwlogsResponse = await cwlogs
      .putSubscriptionFilter(putSubscriptionFilterParams1)
      .promise();

    console.log(cwlogsResponse);
  } catch (error) {
    console.error(
      "Unable to send Create Log Group Request. Error JSON:",
      error
    );
  }

  // cwlogs.createLogGroup(createLogGroupParams1, function (err, data) {
  //   if (err) {
  //     console.error(
  //       "Unable to send Create Log Group Request. Error JSON:",
  //       JSON.stringify(err, null, 2)
  //     );
  //   } else {
  //     const lambdaParams = {
  //       Action: "lambda:InvokeFunction",
  //       FunctionName: "logMessage",
  //       Principal: "logs.us-east-2.amazonaws.com",
  //       SourceArn: `arn:aws:logs:us-east-2:169534841384:log-group:sns/us-east-2/169534841384/${Name}:*`,
  //       StatementId: `${Name}SuccessTrigger`,
  //     };

  //     lambda.addPermission(lambdaParams, function (err, data) {
  //       if (err) {
  //         console.error(
  //           "Unable to send Add Permission Request. Error JSON:",
  //           JSON.stringify(err, null, 2)
  //         );
  //       } else {
  //         var putSubscriptionFilterParams1 = {
  //           destinationArn,
  //           filterName: StatementId1,
  //           filterPattern,
  //           logGroupName: logGroupName1,
  //         };

  //         cwlogs.putSubscriptionFilter(
  //           putSubscriptionFilterParams1,
  //           function (err, data) {
  //             if (err) {
  //               console.error(
  //                 "Unable to send Put Subscription Filter Request. Error JSON:",
  //                 JSON.stringify(err, null, 2)
  //               );
  //             } else {
  //               console.log(
  //                 "Results from Put Subscription Filter Request: ",
  //                 JSON.stringify(data, null, 2)
  //               );
  //             }
  //           }
  //         );
  //         console.log(
  //           "Results from Add Permission Request: ",
  //           JSON.stringify(data, null, 2)
  //         );
  //       }
  //     });
  //     console.log(
  //       "Results from Create Log Group Request: ",
  //       JSON.stringify(data, null, 2)
  //     );
  //   }
  // });
  const text = queries.createEventType;
  const values = [name, serviceId, TopicArn];

  try {
    const response = await db.query(text, values);
    const eventType = response.rows[0];
    return newResponse(201, eventType);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not create event type.",
    });
  }
};

const listEventTypes = async (serviceUuid) => {
  const text = queries.listEventTypes;
  const values = [serviceUuid];

  try {
    const response = await db.query(text, values);
    let eventTypes = response.rows;
    return newResponse(200, eventTypes);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get event types.",
    });
  }
};

const getEventType = async (eventTypeId) => {
  const text = queries.getEventType;
  const values = [eventTypeId];

  try {
    const response = await db.query(text, values);
    const eventType = response.rows[0];

    if (!eventType) {
      return newResponse(404, {
        error_type: "data_not_found",
        detail: "No event type matches given uuid.",
      });
    }

    return newResponse(200, eventType);
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not get event type.",
    });
  }
};

// TODO: Set matching subscriptions as deleted
const deleteEventType = async (serviceUuid, eventTypeId) => {
  const text = queries.deleteEventType;
  const values = [eventTypeId];

  try {
    const response = await db.query(text, values);
    const eventType = response.rows[0];

    if (!eventType) {
      return newResponse(404, {
        error_type: "data_not_found",
        detail: "No event type matches given uuid.",
      });
    }

    const { sns_topic_arn } = eventType; // Pull event topic ARN from DB response
    const snsParams = { TopicArn: sns_topic_arn };

    // "This action is idempotent, so deleting a topic that does not exist does not result in an error."
    const result = await sns.deleteTopic(snsParams).promise();

    return newResponse(204, { Success: "Event type was deleted" });
  } catch (error) {
    console.error(error);
    return newResponse(500, {
      error_type: "process_failed",
      detail: "Could not delete event type.",
    });
  }
};

module.exports = {
  deleteEventType,
  getEventType,
  createEventType,
  listEventTypes,
};
