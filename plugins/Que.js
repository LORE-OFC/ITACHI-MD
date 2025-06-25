import ws from 'ws'

let handler = m => m

handler.before = async function (m, { conn }) {
  if (!m.isGroup) return

  const chat = global.db.data.chats[m.chat] || {}
  const primaryBot = chat.primary_bot
  if (!primaryBot) return  // si no hay bot primario configurado, todos responden

  // Sub-bots conectados
  const activeBots = global.conns.filter(c => c.user && c.ws && c.ws.readyState === ws.OPEN)

  // Participantes del grupo
  const participants = await conn.groupMetadata(m.chat)
    .then(res => res.participants || [])
    .catch(() => [])

  const isPrimaryConnected = activeBots.some(c => c.user.jid === primaryBot)
  const isPrimaryInGroup = participants.some(p => p.id === primaryBot)

  const thisBotJid = conn.user?.jid || this.user?.jid
  const mainBotJid = global.conn?.user?.jid

  // SI el bot primario está conectado y en el grupo → SOLO él responde
  if (isPrimaryConnected && isPrimaryInGroup) {
    if (thisBotJid !== primaryBot) throw !1
  } else {
    // Si el primario NO está disponible → SOLO el main responde
    if (thisBotJid !== mainBotJid) throw !1
  }
}

export default handler
