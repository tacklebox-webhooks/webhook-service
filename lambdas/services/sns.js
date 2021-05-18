const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION });
const sns = new AWS.SNS({ apiVersion: "2010-03-31" });

const deleteEventTypes = async (topicArns) => {
  return await Promise.all(
    topicArns.map(async ({ sns_topic_arn }) => {
      try {
        const snsParams = { TopicArn: sns_topic_arn };
        return await sns.deleteTopic(snsParams).promise();
      } catch (error) {
        console.error(error);
      }
    })
  );
};

const deleteSubscriptions = async (subscriptionArns) => {
  return await Promise.all(
    subscriptionArns.map(async ({ subscription_arn }) => {
      try {
        const snsParams = { SubscriptionArn: subscription_arn };
        return await sns.unsubscribe(snsParams).promise();
      } catch (error) {
        console.error(error);
      }
    })
  );
};

module.exports = {
  deleteEventTypes,
  deleteSubscriptions,
};
