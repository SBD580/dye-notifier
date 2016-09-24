'use strict';

var FOOD_NOTIFICATION_INTERVAL = 1000*15*60;
var DYNAMO_TABLE = 'dynamic-yield-exercise';
var DYNAMO_PK = 'cat';
var LAST_FOOD_TIME_ATTR = 'last_food_time';
var LAST_FOOD_NOTIFIED_ATTR = 'last_food_notified';
var NOTIFICATION_TOPIC_ARN = 'arn:aws:sns:eu-west-1:776897963456:dye-cat';

var aws = require('aws-sdk');

var dynamodb = new aws.DynamoDB({apiVersion: '2012-08-10'});
var sns = new aws.SNS({apiVersion: '2010-03-31'});

exports.handler = function(event, context, callback) {
    dynamodb.updateItem({
        TableName: DYNAMO_TABLE,
        Key: {
            key: {S: DYNAMO_PK}
        },
        UpdateExpression: 'SET '+LAST_FOOD_NOTIFIED_ATTR+' = :notified',
        ExpressionAttributeValues: {
            ':notified': {BOOL: true},
            ':notify_min_time': {N: ""+(Date.now()-FOOD_NOTIFICATION_INTERVAL)}
        },
        ConditionExpression: LAST_FOOD_TIME_ATTR+' < :notify_min_time AND (attribute_not_exists('+LAST_FOOD_NOTIFIED_ATTR+') OR NOT '+LAST_FOOD_NOTIFIED_ATTR+'=:notified)'
    },function(err){
        if(err){
            if(err.code == 'ConditionalCheckFailedException'){
                console.log('The cat is not hungry or already notified');
                return callback();
            }
            return callback(err);
        }

        console.log('Cat is HUNGRY - NOTIFY');

        return sns.publish({
            Subject: '[ALERT] The cat is HUNGRY',
            Message: 'Oh no! The cat has not being fed for too long! Please give him some food',
            TopicArn: NOTIFICATION_TOPIC_ARN
        },callback);
    });
};