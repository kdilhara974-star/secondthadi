const { cmd } = require("../command");

cmd({
  pattern: "creact",
  react: "📢",
  desc: "React to channel message using link only (no reply)",
  category: "channel",
  use: ".creact <link> 🙂,🙃,😊",
  filename: __filename
}, async (conn, mek, m, { q, reply }) => {
  try {
    if (!q) return reply("❌ Use: .creact <channel_link> 🙂,🙃,😊");

    // split by first space
    const spaceIndex = q.indexOf(" ");
    if (spaceIndex === -1)
      return reply("❌ Link ekata passe space ekak one");

    const link = q.slice(0, spaceIndex).trim();
    const emojiPart = q.slice(spaceIndex + 1).trim();

    const emojis = emojiPart
      .split(",")
      .map(e => e.trim())
      .filter(Boolean);

    if (!emojis.length)
      return reply("❌ Emoji list eka hari naha");

    // extract ids from link
    const match = link.match(
      /whatsapp\.com\/channel\/([A-Za-z0-9_-]+)\/([0-9]+)/
    );
    if (!match) return reply("❌ Invalid channel message link");

    const channelId = match[1];
    const messageId = match[2];

    const channelJid = `${channelId}@newsletter`;

    // ⚠️ pseudo key (Baileys workaround)
    const key = {
      remoteJid: channelJid,
      id: messageId,
      fromMe: false,
      participant: channelJid
    };

    for (const emoji of emojis) {
      await conn.sendMessage(channelJid, {
        react: { text: emoji, key }
      });
      await new Promise(r => setTimeout(r, 800));
    }

    reply(`✅ React sent: ${emojis.join(" ")}`);

  } catch (err) {
    console.error("Channel React Error:", err);
    reply(
      "❌ React failed\n\nPossible reasons:\n• Bot not channel admin\n• Old message\n• WhatsApp limitation"
    );
  }
});
