import ws from 'ws';

let handler = m => m;

handler.before = async function (m, { conn }) {
  if (!m.isGroup) return;

  const thisBotJid = conn.user?.jid;
  const mainBotJid = global.conn?.user?.jid;

  if (!thisBotJid || !mainBotJid) return;

  if (!global.db?.data?.chats) {
    if (thisBotJid !== mainBotJid) throw false;
    return;
  }

  const chat = global.db.data.chats[m.chat] || {};
  const primaryBotJid = chat.primary_bot;

  if (primaryBotJid) {
    if (thisBotJid !== primaryBotJid) throw false;
    return;
  }

  return;
};

export default handler;
