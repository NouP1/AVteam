const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  node: process.env.ELASTIC_CLOUD_URL,
  auth: {
    username: process.env.ELASTIC_CLOUD_USERNAME,
    password: process.env.ELASTIC_CLOUD_PASSWORD
  }
  
});

const logUserAction = async (userId,username,firstname, action, details) => {
  try {
    await client.index({
      index: 'telegram-bot-logs',
      body: {
        userId,
        username,
        firstname,
        action,
        details,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error logging to Elasticsearch:', error);
  }
};

const logUserError = async (userId,username,firstname,action,details) => {
  try {
    await client.index({
      index: 'telegram-bot-logs',
      body: {
        userId,
        username,
        firstname,
        action,
        details,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error logging to Elasticsearch:', error);
  }
};
const logBotError = async (error) => {
  try {
    await client.index({
      index: 'telegram-bot-logs',
      body: {
        error,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error logging to Elasticsearch:', error);
  }
};


const checkElasticsearchConnection = async () => {
  try {
    const response = await client.ping();
    console.log('Elasticsearch connection successful:', response);
  } catch (error) {
    console.error('Elasticsearch connection failed:', error);
  }
};

module.exports = { logUserAction, checkElasticsearchConnection, logUserError,logBotError };

