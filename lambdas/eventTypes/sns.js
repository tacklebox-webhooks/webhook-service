const AWS = require("aws-sdk");
const cwlogs = new AWS.CloudWatchLogs({ apiVersion: "2014-03-28" });
const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
AWS.config.update({ region: process.env.AWS_REGION });
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });
const HTTPSuccessFeedbackSampleRate = "100";
const DeliveryPolicy = {
  http: {
    defaultHealthyRetryPolicy: {
      minDelayTarget: 5,
      maxDelayTarget: 1200,
      numRetries: 10,
      numMaxDelayRetries: 0,
      numNoDelayRetries: 0,
      numMinDelayRetries: 0,
      backoffFunction: "exponential",
    },
    disableSubscriptionOverrides: true,
  },
};

const addFailureLogGroup = async (
  logGroupName,
  logGroupNameFailure,
  logMessagesFunctionName,
  REGION,
  accountId,
  snsTopicName,
  destinationArn
) => {
  try {
    await cwlogs
      .createLogGroup({ logGroupName: logGroupNameFailure })
      .promise();
    const lambdaParams = {
      Action: "lambda:InvokeFunction",
      FunctionName: logMessagesFunctionName,
      Principal: `logs.${REGION}.amazonaws.com`,
      SourceArn: `arn:aws:logs:${REGION}:${accountId}:log-group:${logGroupNameFailure}:*`,
      StatementId: `${snsTopicName}FailureTrigger`,
    };

    const lambdaResult = await lambda.addPermission(lambdaParams).promise();
    console.log(lambdaResult);
    // Tell log group to invoke lambda
    const subscriptionFilterParams = {
      destinationArn,
      filterName: lambdaParams.StatementId,
      filterPattern: "",
      logGroupName: logGroupNameFailure,
    };

    const cwlogsResponse = await cwlogs
      .putSubscriptionFilter(subscriptionFilterParams)
      .promise();

    console.log(cwlogsResponse);
  } catch (error) {
    console.error(error);
  }
};

const addSuccessLogGroup = async (
  logGroupName,
  logMessagesFunctionName,
  REGION,
  accountId,
  snsTopicName,
  destinationArn
) => {
  try {
    await cwlogs.createLogGroup({ logGroupName: logGroupName }).promise();

    // Add permissions to logMessage lambda
    const lambdaParams = {
      Action: "lambda:InvokeFunction",
      FunctionName: logMessagesFunctionName,
      Principal: `logs.${REGION}.amazonaws.com`,
      SourceArn: `arn:aws:logs:${REGION}:${accountId}:log-group:${logGroupName}:*`,
      StatementId: `${snsTopicName}SuccessTrigger`,
    };

    const lambdaResult = await lambda.addPermission(lambdaParams).promise();
    console.log(lambdaResult);
    // Tell log group to invoke lambda
    const subscriptionFilterParams = {
      destinationArn,
      filterName: lambdaParams.StatementId,
      filterPattern: "",
      logGroupName,
    };

    const cwlogsResponse = await cwlogs
      .putSubscriptionFilter(subscriptionFilterParams)
      .promise();

    console.log(cwlogsResponse);
  } catch (error) {
    console.error(
      "Unable to send Create Log Group Request. Error JSON:",
      error
    );
  }
};

const createEventType = async (serviceUuid, serviceId, name, accountId) => {
  console.log(serviceUuid, serviceId, name, accountId);
  // Create topic in SNS
  const snsTopicName = `Tacklebox_${serviceUuid}_${name}`;
  const { TopicArn } = await createTopic(accountId, snsTopicName);
  // Create log groups
  const REGION = process.env.AWS_REGION;
  const logGroupName = `sns/${REGION}/${accountId}/${snsTopicName}`;
  const logGroupNameFailure = `${logGroupName}/Failure`;
  const destinationArn = process.env.DESTINATION_ARN;
  const logMessagesFunctionName = process.env.DESTINATION_NAME;
  // Create "success" log group, add permissions and lambda trigger
  await addSuccessLogGroup(
    logGroupName,
    logMessagesFunctionName,
    REGION,
    accountId,
    snsTopicName,
    destinationArn
  );
  // Create "failure" log group, add permissions and lambda trigger
  await addFailureLogGroup(
    logGroupName,
    logGroupNameFailure,
    logMessagesFunctionName,
    REGION,
    accountId,
    snsTopicName,
    destinationArn
  );
  return TopicArn;
};

const createTopic = async (accountId, snsTopicName) => {
  const HTTPSuccessFeedbackRoleArn = `arn:aws:iam::${accountId}:role/SNSSuccessFeedback`;
  const HTTPFailureFeedbackRoleArn = `arn:aws:iam::${accountId}:role/SNSFailureFeedback`;
  const snsParams = {
    Name: snsTopicName,
    Attributes: {
      HTTPSuccessFeedbackRoleArn,
      HTTPFailureFeedbackRoleArn,
      HTTPSuccessFeedbackSampleRate,
      DeliveryPolicy: JSON.stringify(DeliveryPolicy),
    },
  };
  return await sns.createTopic(snsParams).promise();
};

const deleteEventType = async (TopicArn) => {
  const snsParams = { TopicArn };
  return await sns.deleteTopic(snsParams).promise();
};

const deleteSubscriptions = async (subscriptions) => {
  return await Promise.all(
    subscriptions.map(async ({ subscription_arn }) => {
      try {
        const snsParams = { SubscriptionArn: subscription_arn };
        return await sns.unsubscribe(snsParams).promise();
      } catch (error) {
        console.error(error);
      }
    })
  );
};

const getEventType = async (TopicArn) => {
  return await sns.getTopicAttributes({ TopicArn }).promise();
};

module.exports = {
  createEventType,
  deleteEventType,
  deleteSubscriptions,
  getEventType,
};
