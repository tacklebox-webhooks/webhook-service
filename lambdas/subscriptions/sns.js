const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION });
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });

const addSubscription = async (userUuid, snsTopicArn, url) => {
  const FilterPolicy = JSON.stringify({ user_uuid: [userUuid] });
  const snsAttributes = {
    RawMessageDelivery: "true",
    FilterPolicy,
  };
  const snsParams = {
    Protocol: "https",
    TopicArn: snsTopicArn,
    Attributes: snsAttributes,
    Endpoint: url,
    ReturnSubscriptionArn: true,
  };
  const subscription = await sns.subscribe(snsParams).promise();
  return subscription;
};

const addManualSubscription = async (endpoint) => {
  const FilterPolicy = JSON.stringify({ endpoint_url: [endpoint.url] });
  const snsAttributes = {
    RawMessageDelivery: "true",
    FilterPolicy,
  };
  const snsParams = {
    Protocol: "https",
    TopicArn: process.env.RESEND_ARN,
    Attributes: snsAttributes,
    Endpoint: endpoint.url,
    ReturnSubscriptionArn: true,
  };
  const subscription = await sns.subscribe(snsParams).promise();
  return subscription;
};

const deleteSubscription = async (subscriptionArn) => {
  const snsParams = { SubscriptionArn: subscriptionArn };
  const subscription = await sns.unsubscribe(snsParams).promise();
  return subscription;
};

const deleteSubscriptions = async (arns) => {
  await Promise.all(
    arns.map(async ({ subscription_arn }) => {
      try {
        const snsParams = { SubscriptionArn: subscription_arn };
        await sns.unsubscribe(snsParams).promise();
      } catch (error) {
        console.error(error);
      }
    })
  );
};

module.exports = {
  addManualSubscription,
  addSubscription,
  deleteSubscription,
  deleteSubscriptions,
};
