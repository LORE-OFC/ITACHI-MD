import ws from 'ws';

let handler = m => m;

handler.before = async function (m, { conn }) {
    if (!m.isGroup) return;

    const thisBotJid = conn.user?.jid;
    const mainBotJid = global.conn?.user?.jid;
    if (!thisBotJid || !mainBotJid) return;

    const chats = global.db?.data?.chats;
    if (!chats) return;

    const chat = chats[m.chat] || {};
    const primaryBotJid = chat.primary_bot;

    if (primaryBotJid) {
        if (thisBotJid === primaryBotJid) return;

        if (thisBotJid === mainBotJid) {
            const activeJadibots = global.conns?.filter(c => c.user && c.ws?.readyState === ws.OPEN) || [];
            const isPrimaryConnected = activeJadibots.some(c => c.user.jid === primaryBotJid);
            if (!isPrimaryConnected) return;
        }

        throw false;
    }

    return;
};

export default handler;
