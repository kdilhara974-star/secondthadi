const { cmd } = require("../command");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const yts = require("yt-search");

// node-fetch safe
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
    alias: ["play4"],
    react: "🎵",
    desc: "Search & download YouTube song",
    category: "download",
    use: ".song <name or link>",
    filename: __filename,
  },

  async (conn, mek, m, { from, reply, q }) => {
    try {
      if (!q) return reply("🎶 *Song name or YouTube link ekak denna!*");

      let video;
      let ytUrl;

      // 🔍 If NOT a link → search YouTube
      if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
        const search = await yts(q);
        if (!search.videos.length)
          return reply("❌ No results found!");

        video = search.videos[0];
        ytUrl = video.url;
      } 
      // 🔗 If link
      else {
        ytUrl = q;
        const info = await yts({ videoId: q.split("v=")[1]?.split("&")[0] });
        video = info;
      }

      // 🎯 Download API
      const apiUrl = `https://ominisave.vercel.app/api/ytmp3?url=${encodeURIComponent(
        ytUrl
      )}`;

      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data.status || !data.result?.url)
        return reply("❌ Song download failed!");

      const { url, filename } = data.result;

      // temp dir
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const title = video.title || filename.replace(".mp3", "");
      const thumb = video.thumbnail;

      // caption
      const caption = `
🎶 *RANUMITHA-X-MD SONG DOWNLOADER* 🎶

📑 *Title:* ${title}
📡 *Channel:* ${video.author?.name || "Unknown"}
⏱ *Duration:* ${video.timestamp || "N/A"}
👀 *Views:* ${video.views?.toLocaleString() || "N/A"}

🔽 *Reply with number:*

1️⃣ Audio 🎵  
2️⃣ Document 📁  
3️⃣ Voice Note 🎤  

> © Powered by RANUMITHA-X-MD 🌛`;

      const sent = await conn.sendMessage(
        from,
        thumb
          ? { image: { url: thumb }, caption }
          : { text: caption },
        { quoted: fakevCard }
      );

      const msgId = sent.key.id;

      // reply handler (safe)
      const handler = async (msgUpdate) => {
        const mekInfo = msgUpdate.messages[0];
        if (!mekInfo?.message) return;

        const text =
          mekInfo.message.conversation ||
          mekInfo.message.extendedTextMessage?.text;

        const isReply =
          mekInfo.message?.extendedTextMessage?.contextInfo?.stanzaId === msgId;

        if (!isReply) return;

        conn.ev.off("messages.upsert", handler);

        await conn.sendMessage(from, {
          react: { text: "⬇️", key: mekInfo.key },
        });

        // 1️⃣ Audio
        if (text === "1") {
          await conn.sendMessage(
            from,
            {
              audio: { url },
              mimetype: "audio/mpeg",
              fileName: filename,
            },
            { quoted: mek }
          );
        }

        // 2️⃣ Document
        else if (text === "2") {
          await conn.sendMessage(
            from,
            {
              document: { url },
              mimetype: "audio/mpeg",
              fileName: filename,
              caption: title,
            },
            { quoted: mek }
          );
        }

        // 3️⃣ Voice note
        else if (text === "3") {
          const mp3 = path.join(tempDir, `${Date.now()}.mp3`);
          const opus = path.join(tempDir, `${Date.now()}.opus`);

          const buf = Buffer.from(
            await (await fetch(url)).arrayBuffer()
          );
          fs.writeFileSync(mp3, buf);

          await new Promise((res, rej) => {
            ffmpeg(mp3)
              .audioCodec("libopus")
              .format("opus")
              .audioBitrate("64k")
              .save(opus)
              .on("end", res)
              .on("error", rej);
          });

          await conn.sendMessage(
            from,
            {
              audio: fs.readFileSync(opus),
              mimetype: "audio/ogg; codecs=opus",
              ptt: true,
            },
            { quoted: mek }
          );

          fs.unlinkSync(mp3);
          fs.unlinkSync(opus);
        } else {
          return reply("❌ Invalid option!");
        }

        await conn.sendMessage(from, {
          react: { text: "✔️", key: mekInfo.key },
        });
      };

      conn.ev.on("messages.upsert", handler);
    } catch (e) {
      console.error(e);
      reply("⚠️ Error occurred.");
    }
  }
);
