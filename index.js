const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        auth: state,
        printQRInTerminal: true,
        browser: ["Ghost-MD", "Chrome", "1.0.0"]
    })

    // Pour le pairing code - mets ton numéro ici sans le +
    if (!sock.authState.creds.registered) {
        const phoneNumber = "243846711690" // <-- METS TON NUMERO ICI ex: 243846711690 
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber)
            console.log("TON CODE DE PAIRING :", code)
        }, 3000)
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                startBot()
            }
        } else if (connection === 'open') {
            console.log("Ghost-MD connecté !")
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message) return
        const text = m.message.conversation || m.message.extendedTextMessage?.text || ""
        
        if (text === ".ping") {
            await sock.sendMessage(m.key.remoteJid, { text: "Pong! Ghost-MD est actif 👻" })
        }
        if (text === ".menu") {
            await sock.sendMessage(m.key.remoteJid, { text: `
*GHOST-MD MENU*
.ping - tester le bot
.menu - afficher menu
            `})
        }
    })
}

startBot()
