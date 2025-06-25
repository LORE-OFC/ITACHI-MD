import ws from 'ws';

let handler = m => m;

handler.before = async function (m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return;

  const thisBotJid = conn.user?.jid || this.user?.jid;
  const mainBotJid = global.conn?.user?.jid;

  if (!mainBotJid) return;

  const chat = global.db.data.chats[m.chat] || {};
  const primaryBotJid = chat.primary_bot;

  let designatedResponder;

  if (primaryBotJid) {
    const activeConns = global.conns.filter(c => c.user && c.ws && c.ws.readyState === ws.OPEN);
    const isPrimaryConnected = activeConns.some(c => c.user.jid === primaryBotJid);
    
    let isPrimaryInGroup = false;
    if (isPrimaryConnected) {
      try {
        const participants = await conn.groupMetadata(m.chat).then(res => res.participants);
        isPrimaryInGroup = participants.some(p => p.id === primaryBotJid);
      } catch (e) {
        console.error(`[Primary Bot Check] Error al verificar metadata del grupo:`, e);
        isPrimaryInGroup = false;
      }
    }

    if (isPrimaryConnected && isPrimaryInGroup) {
      designatedResponder = primaryBotJid;
    } else {
      designatedResponder = mainBotJid;
    }
  } else {
    designatedResponder = mainBotJid;
  }

  if (thisBotJid !== designatedResponder) {
    throw false;
  }

  return true;
};

export default handler;
