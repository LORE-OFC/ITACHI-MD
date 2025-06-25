import ws from 'ws'

let handler = m => m

handler.before = async function (m, { conn }) {
  if (!m.isGroup) return

  const chat = global.db.data.chats[m.chat] || {}
  const primaryBot = chat.primary_bot
  if (!primaryBot) return

  // Lista de bots activos (sub-bots)
  const users = global.conns.filter(c => c.user && c.ws && c.ws.readyState !== ws.CLOSED)

  // Participantes del grupo
  const participants = await conn.groupMetadata(m.chat)
    .then(res => res.participants || [])
    .catch(() => [])

  const isPrimaryConnected = users.some(c => c.user.jid === primaryBot)
  const isPrimaryInGroup = participants.some(p => p.id === primaryBot)
  const isMainBot = this.user.jid === global.conn.user.jid

  if (isPrimaryConnected && isPrimaryInGroup) {
    if (this.user.jid !== primaryBot) throw !1  // no responde si no es el principal
  } else {
    if (!isMainBot) throw !1 // si el principal no está conectado o no está en el grupo, solo el main responde
  }
}

export default handler
