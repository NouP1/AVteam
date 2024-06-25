const axios = require('axios');
const fs = require('fs');
const cron = require('node-cron');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SHORT_LIVED_TOKEN = process.env.SHORT_LIVED_TOKEN;
const ENV_FILE_PATH = './.env';

// Функция для получения нового долгосрочного токена
const getLongLivedToken = async () => {
    try {
        const response = await axios.get('https://graph.facebook.com/v13.0/oauth/access_token', {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                fb_exchange_token: SHORT_LIVED_TOKEN,
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching long-lived token:', error.response ? error.response.data : error.message);
        throw new Error('Failed to get long-lived token');
    }
};

// Функция для обновления файла .env
const updateEnvFile = (newToken) => {
    try {
        const envConfig = fs.readFileSync(ENV_FILE_PATH, 'utf8');
        const updatedEnvConfig = envConfig.replace(/LONG_LIVED_META_ACCESS_TOKEN=.*/g, `LONG_LIVED_META_ACCESS_TOKEN=${newToken}`);
        fs.writeFileSync(ENV_FILE_PATH, updatedEnvConfig, 'utf8');
        console.log('Updated .env file with new token');
    } catch (error) {
        console.error('Error updating .env file:', error.message);
    }
};

// Задача для обновления токена каждые 50 дней
cron.schedule('0 0 */50 * *', async () => {
    try {
        const longLivedToken = await getLongLivedToken();
        updateEnvFile(longLivedToken);
    } catch (error) {
        console.error('Error updating long-lived token:', error.message);
    }
});

// Для первоначального запуска
(async () => {
    try {
        const longLivedToken = await getLongLivedToken();
        updateEnvFile(longLivedToken);
    } catch (error) {
        console.error('Error during initial token fetch:', error.message);
    }
})();