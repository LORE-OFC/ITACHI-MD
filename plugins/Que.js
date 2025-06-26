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

    let designatedResponder;

    if (primaryBotJid) {
        designatedResponder = primaryBotJid;
    } else {
        designatedResponder = mainBotJid;
    }

    if (thisBotJid === mainBotJid) {
        if (designatedResponder !== mainBotJid) {
            const activeJadibots = global.conns?.filter(c => c.user && c.ws?.readyState === ws.OPEN) || [];
            const isDesignatedConnected = activeJadibots.some(c => c.user.jid === designatedResponder);
            
            if (!isDesignatedConnected) {
                designatedResponder = mainBotJid;
            }
        }
    }
    
    if (thisBotJid !== designatedResponder) {
        throw false;
    }
};

export default handler;
