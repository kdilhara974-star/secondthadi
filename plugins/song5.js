const { cmd } = require("../command");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const yts = require("yt-search");

// node-fetch (safe for Node 18)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Fake vCard
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
    pattern: "song5",
    alias: ["play5", "music5"],
    desc: "YouTube song downloader (Audio) via Ominisave API",
    category: "download",
    filename: __filename,
  },

  async (conn, m, store, { from, quoted, q, reply }) => {
    try {
      let query = q?.trim();

      if (!query && m?.quoted) {
        query =
          m.quoted.message?.conversation ||
          m.quoted.message?.extendedTextMessage?.text ||
          m.quoted.text;
      }

      if (!query) {
        return reply("⚠️ Please provide a song name or a YouTube link.");
      }

      if (query.includes("youtube.com/shorts/")) {
        const id = query.split("/shorts/")[1].split(/[?&]/)[0];
        query = `https://www.youtube.com/watch?v=${id}`;
      }

      await conn.sendMessage(from, { react: { text: '🎵', key: m.key } });

      let video, ytUrl;

      if (!query.includes("youtube.com") && !query.includes("youtu.be")) {
        const search = await yts(query);
        if (!search.videos.length) return reply("❌ Song not found!");
        video = search.videos[0];
        ytUrl = video.url;
      } else {
        ytUrl = query;
        const id = query.includes("v=")
          ? query.split("v=")[1].split("&")[0]
          : query.split("/").pop();
        video = await yts({ videoId: id });
      }

      const apiUrl = `https://ominisave.vercel.app/api/ytmp3?url=${encodeURIComponent(
        ytUrl
      )}`;

      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data.status || !data.result?.url)
        return reply("❌ Failed to download the song!");

      const { url, filename } = data.result;

      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const title = video?.title || filename.replace(/\.mp3$/i, "");
      const thumbnail = video?.thumbnail;

      const caption = `
🎶 *RANUMITHA-X-MD SONG DOWNLOADER* 🎶

📑 *Title:* ${title}
📡 *Channel:* ${video?.author?.name || "Unknown"}
⏱ *Duration:* ${video?.timestamp || "N/A"}
🔗 *URL:* ${ytUrl}

🔽 *Reply with a number only:*

1️⃣ Audio Type 🎵
2️⃣ Document Type 📁
3️⃣ Voice Note Type 🎤

> © Powered by RANUMITHA-X-MD 🌛`;

      const sentMsg = await conn.sendMessage(
        from,
        thumbnail
          ? { image: { url: thumbnail }, caption }
          : { text: caption },
        { quoted: fakevCard }
      );

      const messageID = sentMsg.key.id;

      // 🧠 Reply listener
      conn.ev.on("messages.upsert", async (msgData) => {
        const receivedMsg = msgData.messages[0];
        if (!receivedMsg?.message) return;

        const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
        const senderID = receivedMsg.key.remoteJid;
        const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

        if (isReplyToBot) {
          await conn.sendMessage(senderID, { react: { text: '⬇️', key: receivedMsg.key } });

          const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80);
          const audioFileName = `${safeTitle}.mp3`;
          const tempPath = path.join(tempDir, `${Date.now()}.mp3`);
          const voicePath = path.join(tempDir, `${Date.now()}.opus`);
          
          let mediaMsg;

          switch (receivedText.trim()) {
            case "1":
              await conn.sendMessage(senderID, { react: { text: '⬆️', key: receivedMsg.key } });
              mediaMsg = await conn.sendMessage(senderID, {
                audio: { url },
                mimetype: "audio/mpeg",
                fileName: audioFileName,
              }, { quoted: receivedMsg });
              await conn.sendMessage(senderID, { react: { text: '✔️', key: receivedMsg.key } });
              break;

            case "2":
              await conn.sendMessage(senderID, { react: { text: '⬆️', key: receivedMsg.key } });
              mediaMsg = await conn.sendMessage(senderID, {
                document: { url },
                mimetype: "audio/mpeg",
                fileName: audioFileName,
                caption: title,
              }, { quoted: receivedMsg });
              await conn.sendMessage(senderID, { react: { text: '✔️', key: receivedMsg.key } });
              break;

            case "3":
              await conn.sendMessage(senderID, { react: { text: '⬆️', key: receivedMsg.key } });
              
              // Download and convert to voice note
              const audioRes = await fetch(url);
              const buffer = Buffer.from(await audioRes.arrayBuffer());
              fs.writeFileSync(tempPath, buffer);

              await new Promise((resolve, reject) => {
                ffmpeg(tempPath)
                  .audioCodec("libopus")
                  .format("opus")
                  .audioBitrate("64k")
                  .save(voicePath)
                  .on("end", resolve)
                  .on("error", reject);
              });

              const voice = fs.readFileSync(voicePath);

              mediaMsg = await conn.sendMessage(senderID, {
                audio: voice,
                mimetype: "audio/ogg; codecs=opus",
                ptt: true,
              }, { quoted: receivedMsg });
              
              // Cleanup temp files
              fs.unlinkSync(tempPath);
              fs.unlinkSync(voicePath);
              
              await conn.sendMessage(senderID, { react: { text: '✔️', key: receivedMsg.key } });
              break;

            default:
              await conn.sendMessage(senderID, { react: { text: '😒', key: receivedMsg.key } });
              reply("*❌ Invalid option! Please reply with 1, 2, or 3.*");
          }
        }
      });

    } catch (error) {
      console.error("*Song Plugin Error*:", error);
      reply("*Error downloading or sending audio.*");
    }
  }
);
