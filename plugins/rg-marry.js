// ❀ Codígo creado por https_(S2) ✧
//https://github.com/https0J/Shiroko-Bot.git 

import fs from 'fs';
import path from 'path';

const marriagesFilePath = path.resolve('./src/database/casados.json');
let pendingProposals = {};
let proposalTimeouts = {};

const MIN_AGE = 16;

function loadMarriages() {
  if (fs.existsSync(marriagesFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(marriagesFilePath, "utf8"));
    } catch (error) {
      console.error("Error al parsear casados.json:", error);
    }
  }
  return {};
}

function saveMarriages(marriagesData) {
  try {
    fs.writeFileSync(marriagesFilePath, JSON.stringify(marriagesData, null, 2));
  } catch (error) {
    console.error("Error al guardar casados.json:", error);
  }
}

let marriages = loadMarriages();

function isSpecificBotInstance() {
  try {
    const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
    return pkg.name === "Furina" &&
      pkg.repository.url === "git+https://github.com/Aqua200/Furina.git";
  } catch (error) {
    console.error("Error al leer o parsear package.json:", error);
    return false;
  }
}

async function getUserName(conn, id) {
  try {
    return await conn.getName(id);
  } catch {
    return id.split('@')[0];
  }
}

function getTargetUser(m, args) {
  if (m.mentionedJid && m.mentionedJid[0]) return m.mentionedJid[0];
  if (m.quoted && m.quoted.sender) return m.quoted.sender;
  if (args && args[0]) return args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  return null;
}

function validateUserData(user, id, minAge = MIN_AGE) {
  if (!user) return `✧ El usuario @${id.split('@')[0]} no tiene datos registrados.`;
  if (user.age < minAge) return `✧ @${id.split('@')[0]} debe ser mayor de ${minAge} años para casarse.`;
  return null;
}

let handler = async (m, { conn, command, usedPrefix, args }) => {
  if (!isSpecificBotInstance()) {
    await m.reply("✧ Comando no disponible por el momento.");
    return;
  }

  const isMarry = /^(marry)$/i.test(command);
  const isDivorce = /^(divorce)$/i.test(command);

  const senderId = m.sender;
  const senderData = global.db.data.users[senderId];
  const targetUser = getTargetUser(m, args);

  if (isMarry) {
    let errMsg = validateUserData(senderData, senderId);
    if (errMsg) {
      await m.reply(errMsg);
      return;
    }
    if (marriages[senderId]) {
      const partnerId = marriages[senderId];
      await conn.reply(m.chat, `✧ Ya estás casado/a con *@${partnerId.split('@')[0]}*\n> Puedes divorciarte con el comando: *#divorce*`, m, {
        mentions: [partnerId]
      });
      return;
    }
    if (!targetUser || targetUser === conn.user.jid) {
      await conn.reply(
        m.chat,
        `✧ Debes mencionar a alguien con @ o responder a su mensaje para proponer o aceptar matrimonio.\n> Ejemplo » *${usedPrefix + command} @usuario* o responde a un mensaje con *${usedPrefix + command}*`,
        m,
        { mentions: [conn.user.jid] }
      );
      return;
    }

    const targetId = targetUser;
    const targetData = global.db.data.users[targetId];

    errMsg = validateUserData(targetData, targetId);
    if (errMsg) {
      await m.reply(errMsg, m, { mentions: [targetId] });
      return;
    }
    if (marriages[targetId]) {
      const targetPartnerId = marriages[targetId];
      await conn.reply(m.chat, `✧ @${targetId.split('@')[0]} ya está casado/a con: *@${targetPartnerId.split('@')[0]}*\n> Puedes proponer matrimonio a otra persona.`, m, {
        mentions: [targetId, targetPartnerId]
      });
      return;
    }
    if (senderId === targetId) {
      await m.reply("✧ ¡No puedes proponerte matrimonio a ti mismo!");
      return;
    }

    if (pendingProposals[targetId] && pendingProposals[targetId] === senderId) {
      await m.reply("✧ Ya le has propuesto matrimonio a este usuario. Espera a que responda.");
      return;
    }
    if (Object.values(pendingProposals).includes(senderId) && !(pendingProposals[targetId] && pendingProposals[targetId] === senderId)) {
      await m.reply("✧ Ya tienes una propuesta pendiente. Espera a que respondan antes de enviar otra.");
      return;
    }

    if (pendingProposals[targetId] && pendingProposals[targetId] !== senderId) {
      await m.reply("✧ Esa persona ya tiene una propuesta pendiente. Espera a que responda o intenta más tarde.");
      return;
    }
    if (pendingProposals[senderId] && pendingProposals[senderId] === targetId) {
      const mencionAcepta = args[0] && args[0].includes('@' + targetId.split('@')[0]);
      const replyAcepta = m.quoted && m.quoted.sender === targetId;
      if (!mencionAcepta && !replyAcepta) {
        await m.reply("✧ Para aceptar la propuesta debes mencionar al usuario que te propuso matrimonio con su @ o responder a cualquier mensaje suyo.");
        return;
      }
      delete pendingProposals[senderId];
      if (proposalTimeouts[senderId]) {
        clearTimeout(proposalTimeouts[senderId]);
        delete proposalTimeouts[senderId];
      }
      let senderName = await getUserName(conn, senderId) || senderId.split('@')[0];
      let targetName = await getUserName(conn, targetId) || targetId.split('@')[0];
      marriages[senderId] = targetId;
      marriages[targetId] = senderId;
      saveMarriages(marriages);
      senderData.marry = targetName;
      targetData.marry = senderName;
      await conn.reply(
        m.chat,
        `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩
¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧

*•.¸♡ Esposo/a @${senderId.split('@')[0]} ♡¸.•*
*•.¸♡ Esposo/a @${targetId.split('@')[0]} ♡¸.•*

\`Disfruten de su luna de miel\`

✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`,
        m,
        { mentions: [senderId, targetId] }
      );
      return;
    }

    pendingProposals[targetId] = senderId;

    if (proposalTimeouts[targetId]) {
      clearTimeout(proposalTimeouts[targetId]);
    }
    proposalTimeouts[targetId] = setTimeout(async () => {
      if (pendingProposals[targetId] && pendingProposals[targetId] === senderId) {
        delete pendingProposals[targetId];
        delete proposalTimeouts[targetId];
        try {
          await conn.reply(
            m.chat,
            `✧ La propuesta de matrimonio de @${senderId.split('@')[0]} a @${targetId.split('@')[0]} ha sido cancelada por falta de respuesta en 2 minuto.`,
            m,
            { mentions: [senderId, targetId] }
          );
        } catch (e) {
        }
      }
    }, 2 * 60 * 2000);

    await conn.reply(
      m.chat,
      `♡ @${targetId.split('@')[0]}, @${senderId.split('@')[0]} te ha propuesto matrimonio, ¿aceptas?\n> ✐ Aceptar » ${usedPrefix + command} @${senderId.split('@')[0]}`,
      m,
      { mentions: [senderId, targetId] }
    );
    return;
  }

  if (isDivorce) {
    if (!marriages[senderId]) {
      await m.reply("✧ Tú no estás casado/a con nadie.");
      return;
    }
    const partnerId = marriages[senderId];
    delete marriages[senderId];
    delete marriages[partnerId];
    saveMarriages(marriages);
    if (senderData) senderData.marry = '';
    const partnerData = global.db.data.users[partnerId];
    if (partnerData) partnerData.marry = '';
    await conn.reply(
      m.chat,
      `✐ @${senderId.split('@')[0]} y @${partnerId.split('@')[0]} se han divorciado.`,
      m,
      { mentions: [senderId, partnerId] }
    );
    return;
  }
};

handler.tags = ['rg'];
handler.help = ["marry *@usuario*", "divorce"];
handler.command = ['marry', "divorce", 'divorciarse'];
handler.group = true;

export default handler;1