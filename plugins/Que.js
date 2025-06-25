import ws from 'ws';

let handler = m => m;

handler.before = async function (m, { conn }) {
  if (!m.isGroup) return;

  const thisBotJid = conn.user?.jid;
  const mainBotJid = global.conn?.user?.jid;

  if (!thisBotJid || !mainBotJid) {
    console.warn(`[Primary Bot] No se pudo identificar thisBotJid (${thisBotJid}) o mainBotJid (${mainBotJid}). Se aborta la lógica.`);
    return;
  }

  if (!global.db?.data?.chats) {
    if (thisBotJid !== mainBotJid) {
      throw false;
    }
    return;
  }

  const chat = global.db.data.chats[m.chat] || {};
  const primaryBotJid = chat.primary_bot;
  let designatedResponder;

  if (primaryBotJid) {
    const activeJadibots = global.conns?.filter(c => c.user && c.ws?.readyState === ws.OPEN) || [];
    const isPrimaryConnected = activeJadibots.some(c => c.user.jid === primaryBotJid);
    const isPrimaryTheMainBot = primaryBotJid === mainBotJid;

    if (isPrimaryConnected || isPrimaryTheMainBot) {
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

  return;
};

export default handler;
