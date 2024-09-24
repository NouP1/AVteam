const metaAccessTokenFirst = process.env.LONG_LIVED_TOKEN_FIRST;
const metaAccessTokenSecond = process.env.LONG_LIVED_TOKEN_SECOND;

const businessIdFirst = process.env.BUSINESS_ID_FIRST;
const businessIdSecond = process.env.BUSINESS_ID_SECOND;

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

   
    const pixels = [
        ...pixelsFirst,
        ...pixelSecond
    ];

    inlineKeyboard = pixels.map(pixel => [{
        text: pixel.name,
        callback_data: JSON.stringify({ pixelId: pixel.id, businessId: pixel.businessId })
    }]);

   
}
    module.exports = {sendPixel}