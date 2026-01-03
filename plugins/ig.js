const axios = require("axios");
const { cmd } = require('../command');

cmd({
  pattern: "ig",
  alias: ["insta","instagram"],
  desc: "Download Instagram videos and audio",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "*❌ Please provide a valid Instagram URL*" }, { quoted: m });
    }

    // Initial react
    await conn.sendMessage(from, { react: { text: '📽️', key: m.key } });

    const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data || !data.status || !data.data || data.data.length === 0) {
      return reply("⚠️ Failed to retrieve Instagram media.");
    }

    const media = data.data[0];

    const caption = `
📺 Instagram Downloader 📥

🗂️ *Type:* ${media.type.toUpperCase()}
🔗 *Link:* ${q}

🔢 *Reply Below Number*
1️⃣ HD Quality
2️⃣ Audio (MP3)

> © Powered by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: media.thumbnail },
      caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const text =
        receivedMsg.message.conversation ||
        receivedMsg.message.extendedTextMessage?.text;

      const senderID = receivedMsg.key.remoteJid;
      const isReply =
        receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (!isReply) return;

      switch (text.trim()) {
        case "1":
          if (media.type !== "video") {
            return reply("⚠️ No video found.");
          }

          // ⬇️ Downloading
          await conn.sendMessage(senderID, {
            react: { text: '⬇️', key: receivedMsg.key }
          });

          // ⬆️ Uploading
          await conn.sendMessage(senderID, {
            react: { text: '⬆️', key: receivedMsg.key }
          });

          await conn.sendMessage(senderID, {
            video: { url: media.url },
            caption: "📥 Video Downloaded Successfully!"
          }, { quoted: receivedMsg });

          // ✔️ Sent
          await conn.sendMessage(senderID, {
            react: { text: '✔️', key: receivedMsg.key }
          });
          break;

        case "2":
          // ⬇️ Downloading
          await conn.sendMessage(senderID, {
            react: { text: '⬇️', key: receivedMsg.key }
          });

          // ⬆️ Uploading
          await conn.sendMessage(senderID, {
            react: { text: '⬆️', key: receivedMsg.key }
          });

          await conn.sendMessage(senderID, {
            audio: { url: media.url },
            mimetype: "audio/mp4",
            ptt: false
          }, { quoted: receivedMsg });

          // ✔️ Sent
          await conn.sendMessage(senderID, {
            react: { text: '✔️', key: receivedMsg.key }
          });
          break;

        default:
          reply("*❌ Invalid option!*");
      }
    });

  } catch (err) {
    console.error("Instagram Plugin Error:", err);
    reply("*❌ Error occurred*");
  }
});
