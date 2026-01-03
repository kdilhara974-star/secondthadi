const axios = require("axios");
const { cmd } = require('../command');

cmd({
  pattern: "ig",
  alias: ["insta","instagram"],
  desc: "Instagram Downloader (Stable)",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return reply("❌ Valid Instagram link ekak denna");
    }

    // ⏳ Fetching react
    await conn.sendMessage(from, {
      react: { text: "⏳", key: m.key }
    });

    let data;
    try {
      const res = await axios.get(
        `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(q)}`,
        { timeout: 15000 }
      );
      data = res.data;
    } catch (e) {
      // 🔁 retry once
      const res = await axios.get(
        `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(q)}`,
        { timeout: 15000 }
      );
      data = res.data;
    }

    if (!data?.status || !data.data?.length) {
      return reply("⚠️ Media load venne naha. Tikak passe try karanna.");
    }

    const media = data.data[0];

    // ✅ fetched
    await conn.sendMessage(from, {
      react: { text: "📽️", key: m.key }
    });

    const menuMsg = await conn.sendMessage(from, {
      image: { url: media.thumbnail },
      caption: `
📥 *Instagram Downloader*

1️⃣ HD Video
2️⃣ Audio (MP3)

Reply with number 👇
      `
    }, { quoted: m });

    const menuId = menuMsg.key.id;

    conn.ev.on("messages.upsert", async ({ messages }) => {
      const msg = messages[0];
      if (!msg?.message) return;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text;

      const isReply =
        msg.message.extendedTextMessage?.contextInfo?.stanzaId === menuId;

      if (!isReply) return;

      // ⬇️ Downloading
      await conn.sendMessage(from, {
        react: { text: "⬇️", key: msg.key }
      });

      await new Promise(r => setTimeout(r, 600));

      // ⬆️ Uploading
      await conn.sendMessage(from, {
        react: { text: "⬆️", key: msg.key }
      });

      if (text.trim() === "1" && media.type === "video") {
        await conn.sendMessage(from, {
          video: { url: media.url },
          caption: "✅ Video Ready"
        }, { quoted: msg });

      } else if (text.trim() === "2") {
        await conn.sendMessage(from, {
          audio: { url: media.url },
          mimetype: "audio/mp4"
        }, { quoted: msg });

      } else {
        return reply("❌ Wrong option");
      }

      // ✔️ Done
      await conn.sendMessage(from, {
        react: { text: "✔️", key: msg.key }
      });
    });

  } catch (err) {
    console.error(err);
    reply("❌ Unexpected error. Later try karanna.");
  }
});
