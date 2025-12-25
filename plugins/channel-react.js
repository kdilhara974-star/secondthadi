const { cmd } = require("../command");

cmd({
  pattern: "creact",
  react: "📢",
  desc: "React multiple emojis to channel message",
  category: "channel",
  use: ".creact <link>,💙,❤️,💚",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) {
      return reply(
        "❌ Use:\n.creact <channel_link>,💙,❤️,💚\n\nOR\nReply channel msg + .creact 💙,❤️"
      );
    }

    let emojis = [];
    let targetKey = null;

    // ✅ Case 1: Reply to channel message (BEST)
    if (m.quoted) {
      targetKey = m.quoted.key;
      emojis = q.split(",").map(e => e.trim()).filter(Boolean);
    }

    // ✅ Case 2: Using channel message link
    else {
      const parts = q.split(",");
      if (parts.length < 2)
        return reply("❌ Link + emojis denna\nExample:\n.creact <link>,💙,❤️");

      const link = parts.shift().trim();
      emojis = parts.map(e => e.trim()).filter(Boolean);

      // Try to extract message id from link
      const match = link.match(/\/([^\/]+)$/);
      if (!match) return reply("❌ Invalid channel message link");

      const messageId = match[1];

      // ⚠️ Best-effort key (Baileys limitation)
      targetKey = {
        remoteJid: from,
        id: messageId,
        fromMe: false
      };
    }

    if (!emojis.length) return reply("❌ Emoji list eka hari naha");

    // 🔥 Send reactions one by one
    for (const emoji of emojis) {
      await conn.sendMessage(from, {
        react: {
          text: emoji,
          key: targetKey
        }
      });

      await new Promise(r => setTimeout(r, 500)); // anti-spam delay
    }

    reply(`✅ Reacted with: ${emojis.join(" ")}`);

  } catch (err) {
    console.error(err);
    reply("❌ Channel react failed");
  }
});
