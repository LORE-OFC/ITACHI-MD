const handler = async (m, { isPrems, conn }) => {
  if (!global.db.data.users[m.sender]) throw `${emoji4} Usuario no encontrado.`;

  const user = global.db.data.users[m.sender];
  const lastCofreTime = user.lastcofre;
  const timeToNextCofre = lastCofreTime + 86400000;

  if (Date.now() < timeToNextCofre) {
    const tiempoRestante = timeToNextCofre - Date.now();
    const mensajeEspera = `${emoji3} Ya reclamaste tu cofre\n⏰️ Regresa en: *${msToTime(tiempoRestante)}* para volver a reclamar.`;
    await conn.sendMessage(m.chat, { text: mensajeEspera }, { quoted: m });
    return;
  }

  const cofres = [
    {
      tipo: '🪵 Madera',
      img: 'https://i.imgur.com/KvMqxDC.jpeg',
      coin: [10, 50],
      diamonds: [10, 20],
      tokens: [0, 1],
      exp: [100, 500]
    },
    {
      tipo: '🥈 Plata',
      img: 'https://i.imgur.com/mcNNSWA.jpeg',
      coin: [50, 150],
      diamonds: [20, 30],
      tokens: [1, 3],
      exp: [300, 1000]
    },
    {
      tipo: '🥇 Oro',
      img: 'https://i.imgur.com/gkQgEVQ.jpeg',
      coin: [150, 400],
      diamonds: [40, 50],
      tokens: [2, 5],
      exp: [1000, 3000]
    },
    {
      tipo: '💎 Cristal',
      img: 'https://i.imgur.com/yKrWqPt.jpeg',
      coin: [400, 800],
      diamonds: [90, 100],
      tokens: [3, 7],
      exp: [3000, 6000]
    }
  ];

  const cofre = cofres[Math.floor(Math.random() * cofres.length)];

  const dia = randomInt(cofre.coin);
  const tok = randomInt(cofre.tokens);
  const ai = randomInt(cofre.diamonds);
  const expp = randomInt(cofre.exp);

  user.coin += dia;
  user.diamonds += ai;
  user.joincount += tok;
  user.exp += expp;
  user.lastcofre = Date.now();

  const texto = `
╭━〔 Cσϝɾҽ ᴀʟ ᴀᴢᴀʀ 〕⬣
┃📦 *Cofre:* ${cofre.tipo}
┃ ¡Felicidades!
╰━━━━━━━━━━━━⬣

╭━〔 Rҽcσmpҽnʂαs 〕⬣
┃ *${dia} ${moneda}* 💸
┃ *${tok} Tokens* ⚜️
┃ *${ai} Diamantes* 💎
┃ *${expp} Exp* ✨
╰━━━━━━━━━━━━⬣`;

  try {
    await conn.sendFile(m.chat, cofre.img, 'cofre.jpg', texto, fkontak);
  } catch (error) {
    throw `${msm} Ocurrió un error al enviar el cofre.`;
  }
};

handler.help = ['cofre'];
handler.tags = ['rpg'];
handler.command = ['cofre'];
handler.level = 5;
handler.group = true;
handler.register = true;

export default handler;

function randomInt([min, max]) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function msToTime(duration) {
  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? '0' + hours : hours;
  minutes = (minutes < 10) ? '0' + minutes : minutes;
  seconds = (seconds < 10) ? '0' + seconds : seconds;

  return `${hours} Horas ${minutes} Minutos`;
}
