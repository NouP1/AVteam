
module.exports = { 
back:{
    reply_markup: JSON.stringify({ 
      inline_keyboard: [
        [{text:'Выбрать другой пиксель',callback_data:'selectPixel'}]
      
      ]
    })
  },
  backError:{
    reply_markup: JSON.stringify({ 
      inline_keyboard: [
        [{text:'Выбрать другой пиксель',callback_data:'selectPixel'}],
        [{text:'Изменить account_id',callback_data:'edditAccountId'}]
      ]
    })
  }

}