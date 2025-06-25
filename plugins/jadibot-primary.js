const handler = async (m, { conn, args, usedPrefix }) => {
  if (!args[0] && !m.mentionedJid?.length) {
    return m.reply(`⚠️ Etiqueta o escribe el número del bot que quieres establecer como principal.\n\nEjemplo: *${usedPrefix}setprimary @bot*`);
  }

  const activeConns = global.conns.filter(c => c.user && c.ws?.readyState === 1);

  let botJid;
  let selectedBot;

  if (m.mentionedJid?.length) {
    botJid = m.mentionedJid[0];
  } else {
    const number = args[0].replace(/\D/g, '');
    if (!number) return m.reply('⚠️ Número inválido.');
    botJid = number + '@s.whatsapp.net';
  }

  if (botJid === conn.user.jid) {
    selectedBot = conn;
  } else {
    selectedBot = activeConns.find(c => c.user?.jid === botJid);
  }

  if (!selectedBot) {
    try {
      const groupMeta = await conn.groupMetadata(m.chat);
      const participants = groupMeta.participants.map(p => p.id);
      if (!participants.includes(botJid)) {
        return m.reply('⚠️ El bot mencionado no está en este grupo. No se puede establecer como primario.');
      }
    } catch (e) {
      return m.reply('⚠️ No se encontró un bot conectado con esa mención o número. Usa *.listjadibot* para ver los disponibles.');
    }
  }

  if (!global.db.data.chats[m.chat]) {
    global.db.data.chats[m.chat] = {};
  }

  global.db.data.chats[m.chat].primary_bot = botJid;

  const tag = '@' + botJid.split('@')[0];
  const mensaje = `✅ El bot ${tag} ha sido establecido como *bot primario* en este grupo.\n\nDe ahora en adelante, solo él responderá a los comandos aquí. Si se desconecta, el bot principal tomará el control.`;

  await conn.sendMessage(m.chat, {
    text: mensaje,
    mentions: [botJid]
  }, { quoted: m });
};

handler.help = ['setprimary <@bot|número>'];
handler.tags = ['jadibot'];
handler.command = ['setprimary'];
handler.group = true;
handler.admin = true;
handler.botAdmin = false;

export default handler;
