const { cmd } = require("../command");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

// node-fetch (Node 18 safe)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// fake quoted
const fakevCard = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast",
  },
  message: {
    contactMessage: {
      displayName: "© RANUMITHA-X-MD",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:RANUMITHA-X-MD
ORG:SONG DOWNLOADER;
TEL;type=CELL;waid=94762095304:+94762095304
END:VCARD`,
    },
  },
};

cmd(
  {
    pattern: "song4",
    alias: ["play"],
    react: "🎵",
    desc: "Download song with full options",
    category: "download",
    use: ".song <song name>",
    filename: __filename,
  },

  async (conn, mek, m, { from, reply, q }) => {
    try {
      if (!q) return reply("🎶 *Song name ekak denna!*");

      // make temp folder
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      // API (change to your real endpoint)
      const apiUrl = `https://YOUR_API_URL_HERE?q=${encodeURIComponent(q)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data.status || !data.result?.url) {
        return reply("❌ Song not found!");
      }

      const { url, filename } = data.result;
      const safeName = filename.replace(/[\\/:*?"<>|]/g, "");

      // caption
      const caption = `
🎶 *RANUMITHA-X-MD SONG DOWNLOADER* 🎶

📑 *Title:* ${safeName}
📥 *Quality:* MP3
🌐 *Source:* YouTube

🔽 *Reply with number:*

1️⃣ Audio 🎵  
2️⃣ Document 📁  
3️⃣ Voice Note 🎤  

> © Powered by RANUMITHA-X-MD 🌛`;

      const sent = await conn.sendMessage(
        from,
        { text: caption },
        { quoted: fakevCard }
      );

      const msgId = sent.key.id;

      // one-time reply handler
      const handler = async (msgUpdate) => {
        try {
          const mekInfo = msgUpdate.messages[0];
          if (!mekInfo?.message) return;

          const text =
            mekInfo.message.conversation ||
            mekInfo.message.extendedTextMessage?.text;

          const isReply =
            mekInfo.message?.extendedTextMessage?.contextInfo?.stanzaId ===
            msgId;

          if (!isReply) return;

          conn.ev.off("messages.upsert", handler);

          await conn.sendMessage(from, {
            react: { text: "⬇️", key: mekInfo.key },
          });

          // option
          if (text === "1") {
            await conn.sendMessage(
              from,
              {
                audio: { url },
                mimetype: "audio/mpeg",
                fileName: safeName,
              },
              { quoted: mek }
            );
          } 
          
          else if (text === "2") {
            await conn.sendMessage(
              from,
              {
                document: { url },
                mimetype: "audio/mpeg",
                fileName: safeName,
                caption: safeName,
              },
              { quoted: mek }
            );
          } 
          
          else if (text === "3") {
            const mp3Path = path.join(tempDir, `${Date.now()}.mp3`);
            const opusPath = path.join(tempDir, `${Date.now()}.opus`);

            const buf = Buffer.from(
              await (await fetch(url)).arrayBuffer()
            );
            fs.writeFileSync(mp3Path, buf);

            await new Promise((res, rej) => {
              ffmpeg(mp3Path)
                .audioCodec("libopus")
                .format("opus")
                .audioBitrate("64k")
                .save(opusPath)
                .on("end", res)
                .on("error", rej);
            });

            await conn.sendMessage(
              from,
              {
                audio: fs.readFileSync(opusPath),
                mimetype: "audio/ogg; codecs=opus",
                ptt: true,
              },
              { quoted: mek }
            );

            fs.unlinkSync(mp3Path);
            fs.unlinkSync(opusPath);
          } 
          
          else {
            return reply("❌ *Invalid option!*");
          }

          await conn.sendMessage(from, {
            react: { text: "✔️", key: mekInfo.key },
          });
        } catch (e) {
          console.error(e);
        }
      };

      conn.ev.on("messages.upsert", handler);
    } catch (e) {
      console.error(e);
      reply("⚠️ Error occurred.");
    }
  }
);
