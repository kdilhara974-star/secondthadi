const { cmd } = require("../command");

cmd({
  pattern: "creact",
  react: "📢",
  desc: "React to channel message using link",
  category: "channel",
  use: ".creact <channel_link>,💚",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) {
      return reply(
        "❌ Use:\n.creact https://whatsapp.com/channel/XXXX/MSGID,💚"
      );
    }

    // split link & emojis
    const parts = q.split(",");
    if (parts.length < 2) {
      return reply("❌ Link eka saha emoji eka denna");
    }

    const link = parts.shift().trim();
    const emojis = parts.map(e => e.trim()).filter(Boolean);

    // extract channel id & message id
    const match = link.match(
      /whatsapp\.com\/channel\/([A-Za-z0-9]+)\/([0-9]+)/
    );

    if (!match) return reply("❌ Invalid channel link");

    const channelId = match[1];
    const messageId = match[2];

    const channelJid = `${channelId}@newsletter`;

    const key = {
      remoteJid: channelJid,
      id: messageId,
      fromMe: false
    };

    // send reactions
    for (const emoji of emojis) {
      await conn.sendMessage(channelJid, {
        react: {
          text: emoji,
          key
        }
      });

      await new Promise(r => setTimeout(r, 600));
    }

    reply(`✅ React sent: ${emojis.join(" ")}`);

  } catch (err) {
    console.error(err);
    reply("❌ Channel react failed");
  }
});
