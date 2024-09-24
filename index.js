const TelegramApi = require('node-telegram-bot-api');
const axios = require('axios');
const { back, backError } = require('./options');
const { logUserAction, checkElasticsearchConnection, logBotError, logUserError } = require('./elastic');
// const {sendPixel} = require('./sendPix')
require('dotenv').config();

const token = process.env.TOKEN;
const key = process.env.KEY;
const metaAccessTokenFirst = process.env.LONG_LIVED_TOKEN_FIRST;
const metaAccessTokenSecond = process.env.LONG_LIVED_TOKEN_SECOND;

const businessIdFirst = process.env.BUSINESS_ID_FIRST;
const businessIdSecond = process.env.BUSINESS_ID_SECOND;


const bot = new TelegramApi(token, { polling: true });

const start = async () => {
    await checkElasticsearchConnection();
    bot.setMyCommands([
        { command: '/start', description: "Перезапуск бота" },
    ]);

    const user = {
        pixelId: null,
        pixelName: null,
        accountId: null,
        businessId: null,
    };
    let authorizedUsers = {};
    let inlineKeyboard = [];

    bot.on('message', async msg => {
        try {
            const text = msg.text;
            const chatId = msg.chat.id;
            const messageId = msg.message_id;
            const username = msg.from.username;
            const firstname = msg.from.first_name;
            console.log(`Пользователь ${username},${firstname}\n Отправил сообщение в бот: ${text}`)

            if (text === '/start') {
                if (!authorizedUsers[chatId]) {
                    await bot.sendMessage(chatId, "Привет, введи ключ!")

                } else {

                    authorizedUsers[chatId] = true;

async function sendPixel(chatId) {
                    const [listpixelsFirst, listpixelsSecond] = await Promise.all([
                        axios.get(`https://graph.facebook.com/v20.0/${businessIdFirst}/adspixels?fields=name`, {
                            headers: {
                                'Authorization': `Bearer ${metaAccessTokenFirst}`
                            }
                        }),
                        axios.get(`https://graph.facebook.com/v20.0/${businessIdSecond}/adspixels?fields=name`, {
                            headers: {
                                'Authorization': `Bearer ${metaAccessTokenSecond}`
                            }
                        })
                    ]);

                    const pixelPurposes = {
                        '1092606521936943': 'Для pwa прил тир 3',
                        '896644941674454': 'Для iOS ZM',
                        '786851899966322': 'Для iOS Buzz прил',
                        '961413918926551': 'Для pwa тир 1-2',
                        '3854526388163031' : 'только для сша'
                    };

                    // Берем первые три пикселя из первого бизнес-менеджера и первый пиксель из второго
                    const pixelsFirst = listpixelsFirst.data.data.slice(0, 4).map(pixel => ({
                        ...pixel,
                        businessId: businessIdFirst,
                        name: `${pixel.name} - ${pixelPurposes[pixel.id] || ''}`
                    }));
                    const pixelSecond = listpixelsSecond.data.data.slice(0, 1).map(pixel => ({
                        ...pixel,
                        businessId: businessIdSecond,
                        name: `${pixel.name} - ${pixelPurposes[pixel.id] || ''}`
                    }));

                    // Объединяем массивы
                    const pixels = [
                        ...pixelsFirst,
                        ...pixelSecond
                    ];

                    // Формируем массив кнопок
                    inlineKeyboard = pixels.map(pixel => [{
                        text: pixel.name,
                        callback_data: JSON.stringify({ pixelId: pixel.id, businessId: pixel.businessId })
                    }]);

               


                    await bot.sendMessage(chatId, "Привет, выбирай нужный тебе пиксель", {
                        reply_markup: {
                            inline_keyboard: inlineKeyboard
                        }
                    });
                 }
                }

            } else if (!authorizedUsers[chatId]) {
                // Проверяем ключ, если пользователь не авторизован
                if (text === key) {
                    authorizedUsers[chatId] = true;

                    await sendPixel(chatId)
                } else {
                    await bot.sendMessage(chatId, "Неверный ключ!");
                }

            } else {
                try {
                    
                    user.accountId = text;
                    const metaAccessToken = user.businessId === businessIdFirst ? metaAccessTokenFirst : metaAccessTokenSecond;
                    const sharedPixels = await axios.post(`https://graph.facebook.com/v20.0/${user.pixelId}/shared_accounts`,
                        {
                            account_id: user.accountId,
                            business: user.businessId
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${metaAccessToken}`
                            }
                        })

                    await bot.sendMessage(chatId, "Пиксель успешно пошерен! 👌", back)

                    console.log(
                        "Пиксель успешно пошерен!:\n" +
                        "   Пользователь: " + username + ", " + firstname + "\n" +
                        "   Пиксель: " + user.pixelId + ", " + user.pixelName + "\n" +
                        "   Рекламный аккаунт: " + user.accountId + "\n" +
                        "   Бизнес менеджер: " + user.businessId + "\n" +
                        "   Статус: " + JSON.stringify(sharedPixels.data, null, 2)
                    )

                    logUserAction(chatId, username, firstname, 'Успешно пошерил пиксель', {
                        pixelId: user.pixelId,
                        pixelName: user.pixelName,
                        accountId: user.accountId,
                        businessId: user.businessId,
                        status: sharedPixels.data
                    });
                    user.pixelId = null
                    user.pixelName = null
                    user.accountId = null
                    user.businessId = null


                } catch (error) {
                    if (error.response) {
                        console.error('Ошибка от сервера:', error.response.data);
                        const { error_user_msg, code, message } = error.response.data.error;
                        await bot.sendMessage(chatId, "Произошла ошибка при попытке шеринга пикселя.\n" +
                            "Код ошибки: " + code + "\n" + message + "\n" + error_user_msg, backError);

                        logUserError(chatId, username, firstname, 'share_pixel_error', { pixelName: user.pixelName, accountId: user.accountId, code, message, error_user_msg })



                    } else if (error.request) {
                        const { error_user_msg, code, message } = error.request.data.error;
                        console.error('Ошибка запроса:', error.request);
                        console.error(error)
                        await bot.sendMessage(chatId, "Произошла ошибка при попытке шеринга пикселя.");

                        logUserError(chatId, username, firstname, 'share_pixel_error', { pixelName: user.pixelName, accountId: user.accountId, code, message, error_user_msg });

                    }

                }
            }
        } catch (error) {
            console.log(error)
            logBotError(error)
        }

    });



    bot.on('callback_query', async msg => {
        try {
            const data = msg.data;
            const chatId = msg.message.chat.id;
            const messageId = msg.message.message_id;
            const userId = msg.from.id;
            const username = msg.from.username;
            const firstname = msg.from.first_name;

            console.log('Received message details:');
            console.log('from.id:', userId);
            console.log('from.username:', username);
            console.log('from.firstname:', firstname);
            console.log('data:', data);
            console.log('message.message_id:', messageId);

            if (data && data !== 'selectPixel' && data !== 'edditAccountId') {
                const parsedData = JSON.parse(data);
                user.pixelId = parsedData.pixelId;
                user.businessId = parsedData.businessId;

                const selectedPixel = inlineKeyboard
                    .flatMap(buttons => buttons)
                    .find(button => JSON.parse(button.callback_data).pixelId === user.pixelId);
                user.pixelName = selectedPixel.text;

                await bot.editMessageText("Отправь мне номер account_id, на который нужно пошерить выбранный пиксель", {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: back.reply_markup
                })
            }
            if (data === 'selectPixel') {

                const [listpixelsFirst, listpixelsSecond] = await Promise.all([
                    axios.get(`https://graph.facebook.com/v20.0/${businessIdFirst}/adspixels?fields=name`, {
                        headers: {
                            'Authorization': `Bearer ${metaAccessTokenFirst}`
                        }
                    }),
                    axios.get(`https://graph.facebook.com/v20.0/${businessIdSecond}/adspixels?fields=name`, {
                        headers: {
                            'Authorization': `Bearer ${metaAccessTokenSecond}`
                        }
                    })
                ]);

                const pixelPurposes = {
                    '1092606521936943': 'Для pwa прил тир 3',
                    '896644941674454': 'Для iOS ZM',
                    '786851899966322': 'Для iOS Buzz прил',
                    '961413918926551': 'Для pwa тир 1-2'
                };

                // Берем первые три пикселя из первого бизнес-менеджера и первый пиксель из второго
                const pixelsFirst = listpixelsFirst.data.data.slice(0, 3).map(pixel => ({
                    ...pixel,
                    businessId: businessIdFirst,
                    name: `${pixel.name} - ${pixelPurposes[pixel.id] || ''}`
                }));
                const pixelSecond = listpixelsSecond.data.data.slice(0, 1).map(pixel => ({
                    ...pixel,
                    businessId: businessIdSecond,
                    name: `${pixel.name} - ${pixelPurposes[pixel.id] || ''}`
                }));

                // Объединяем массивы
                const pixels = [
                    ...pixelsFirst,
                    ...pixelSecond
                ];


                // Формируем массив кнопок
                inlineKeyboard = pixels.map(pixel => [{
                    text: pixel.name,
                    callback_data: JSON.stringify({ pixelId: pixel.id, businessId: pixel.businessId })
                }]);

                await bot.editMessageText('Выбери нужный пиксель', {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: inlineKeyboard
                    }
                })
            }
            if (data === 'edditAccountId') {
                await bot.editMessageText('Отправь мне номер account_id, на который нужно пошерить выбранный пиксель', {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: back.reply_markup
                });

            }

        } catch (error) {
            console.log(error)
            logBotError(error)
        }


    });

    console.log('Bot is running...');
};


start()