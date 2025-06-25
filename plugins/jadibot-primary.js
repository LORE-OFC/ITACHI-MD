const handler = async (m, { conn, args, usedPrefix }) => {
  if (!args[0] && !m.mentionedJid?.length)
    return m.reply(`⚠️ Etiqueta o escribe el número del bot que quieres establecer como principal.\n\nEjemplo: *${usedPrefix}setprimary @bot*`)

  const activeConns = global.conns.filter(c => c.user && c.ws && c.ws.readyState === 1)

  let botJid, selectedBot

  if (m.mentionedJid?.length) {
    botJid = m.mentionedJid[0]
    selectedBot = botJid === conn.user.jid ? conn : activeConns.find(c => c.user?.jid === botJid)
  } else {
    const number = args[0].replace(/\D/g, '')
    botJid = number + '@s.whatsapp.net'
    selectedBot = botJid === conn.user.jid ? conn : activeConns.find(c => c.user?.jid === botJid)
  }

  if (!selectedBot)
    return m.reply('⚠️ No se encontró un bot conectado con esa mención o número. Usa *.listjadibot* para ver los disponibles.')

  db.data.chats[m.chat] ??= {}
  db.data.chats[m.chat].primary_bot = botJid

  const userTag = '@' + botJid.split('@')[0]
  const text = `✅ El bot ${userTag} ha sido establecido como *bot primario* en este grupo.\nLos demás bots ignorarán los comandos aquí.`

  await conn.sendMessage(m.chat, {
    text,
    mentions: [botJid]
  }, { quoted: m })
}

handler.help = ['setprimary <@bot|número>']
handler.tags = ['jadibot']
handler.command = ['setprimary']
handler.group = true
handler.register = true

export default handler
