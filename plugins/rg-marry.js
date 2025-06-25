import fs from 'fs';
import path from 'path';

const marriagesFilePath = path.resolve('./src/database/casados.json');

let pendingProposals = {};

function loadMarriages() {
  if (fs.existsSync(marriagesFilePath)) {
    const fileContent = fs.readFileSync(marriagesFilePath, "utf8");
    try {
      return JSON.parse(fileContent);
    } catch (error) {
      console.error("Error al parsear casados.json:", error);

      return {};
    }
  } else {
    return {};
  }
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
    const packageJsonContent = fs.readFileSync("./package.json", "utf-8");
    const packageInfo = JSON.parse(packageJsonContent);
    if (packageInfo.name !== "Furina") {
      return false;
    }
    if (packageInfo.repository.url !== "git+https://github.com/Aqua200/Furina.git") {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error al leer o parsear package.json:", error);
    return false;
  }
}

let handler = async (m, { conn, command, usedPrefix, args }) => {

  if (!isSpecificBotInstance()) {
    await m.reply("✧ Comando no disponible por el momento.");
    return;
  }

  const isMarryCommand = /^(marry)$/i.test(command);
  const isDivorceCommand = /^(divorce)$/i.test(command);

  const senderId = m.sender;
  const senderData = global.db.data.users[senderId];

  switch (true) {
    case isMarryCommand:
      if (!senderData) {
        await m.reply("✧ No se encontraron tus datos. Intenta registrarte primero.");
        return;
      }
      if (senderData.age < 18) {
        await m.reply("✧ Debes ser mayor de 18 años para casarte.");
        return;
      }

      if (marriages[senderId]) {
        const partnerId = marriages[senderId];
        await conn.reply(m.chat, `✧ Ya estás casado/a con *@${partnerId.split('@')[0]}*\n> Puedes divorciarte con el comando: *#divorce*`, m, {
          mentions: [partnerId]
        });
        return;
      }

      if (!m.mentionedJid || m.mentionedJid.length === 0) {
        await conn.reply(m.chat, `✧ Debes mencionar a alguien para proponer o aceptar matrimonio.\n> Ejemplo » *${usedPrefix + command} @${conn.user.jid.split('@')[0]}*`, m, {
          mentions: [conn.user.jid]
        });
        return;
      }

      const targetId = m.mentionedJid[0];
      const targetData = global.db.data.users[targetId];

      if (!targetData) {
        await m.reply(`✧ El usuario @${targetId.split('@')[0]} no tiene datos registrados.`, m, { mentions: [targetId]});
        return;
      }

      if (targetData.age < 18) {
          await m.reply(`✧ @${targetId.split('@')[0]} debe ser mayor de 18 años para casarse.`, null, { mentions: [targetId] });
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
        delete pendingProposals[targetId];

        const senderName = await conn.getName(senderId);
        const targetName = await conn.getName(targetId);

        marriages[senderId] = targetId;
        marriages[targetId] = senderId;
        saveMarriages(marriages);

        if (senderData) senderData.marry = targetName;
        if (targetData) targetData.marry = senderName;

        await conn.reply(m.chat, `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩
¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧

*•.¸♡ Esposo/a @${senderId.split('@')[0]} ♡¸.•*
*•.¸♡ Esposo/a @${targetId.split('@')[0]} ♡¸.•*

\`Disfruten de su luna de miel\`

✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`, m, {
          mentions: [senderId, targetId]
        });
      } else {
        pendingProposals[senderId] = targetId;


        await conn.reply(m.chat, `♡ @${targetId.split('@')[0]}, @${senderId.split('@')[0]} te ha propuesto matrimonio, ¿aceptas?\n> ✐ Aceptar » *${usedPrefix + command}* @${senderId.split('@')[0]}`, m, {
          mentions: [senderId, targetId]
        });
      }
      break;

    case isDivorceCommand:
      if (!marriages[senderId]) {
        await m.reply("✧ Tú no estás casado/a con nadie.");
        return;
      }

      const partnerIdToDivorce = marriages[senderId];

      delete marriages[senderId];
      delete marriages[partnerIdToDivorce];
      saveMarriages(marriages);

      if (senderData) senderData.marry = '';
      const partnerData = global.db.data.users[partnerIdToDivorce];
      if (partnerData) partnerData.marry = '';

      await conn.reply(m.chat, `✐ @${senderId.split('@')[0]} y @${partnerIdToDivorce.split('@')[0]} se han divorciado.`, m, {
        mentions: [senderId, partnerIdToDivorce]
      });
      break;
  }
};

handler.tags = ['rg'];
handler.help = ["marry *@usuario*", "divorce"];
handler.command = ['marry', "divorce", 'divorciarse'];
handler.group = true; 

export default handler;
