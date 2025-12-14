const { cmd } = require("../command");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

// Ensure temp folder exists
const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

cmd(
  {
    pattern: "csongl",
    react: "🎵",
    desc: "Send YouTube song as voice note to a WhatsApp Channel (@newsletter)",
    category: "download",
    use: ".csong <YouTube URL> /<ChannelID>",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply, args }) => {
    try {
      if (!args || args.length < 1)
        return reply(
          "⚠️ Usage: .csong <YouTube URL> /<ChannelID>\nExample: .csong https://youtu.be/abc123 /1234567890"
        );

      const input = args.join(" "); // join everything
      const parts = input.split("/"); // split at "/"

      if (parts.length < 2)
        return reply(
          "⚠️ Please provide the channel ID using /\nExample: .csong https://youtu.be/abc123 /1234567890"
        );

      const query = parts[0].trim(); // YouTube link or song name
      const channelJid = parts[1].trim() + "@newsletter"; // append @newsletter

      // Convert shorts to normal YouTube URL
      let url = query;
      if (query.includes("youtube.com/shorts/")) {
        const videoId = query.split("/shorts/")[1].split(/[?&]/)[0];
        url = `https://www.youtube.com/watch?v=${videoId}`;
      }

      // Fetch song info from Nekolabs API
      const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(
        url
      )}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data?.success || !data?.result?.downloadUrl)
        return reply("❌ Song not found or API error.");

      const meta = data.result.metadata;
      const dlUrl = data.result.downloadUrl;

      // Download audio
      const audioRes = await fetch(dlUrl);
      const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
      const tempPath = path.join(tempDir, `${Date.now()}.mp3`);
      const voicePath = path.join(tempDir, `${Date.now()}.opus`);
      fs.writeFileSync(tempPath, audioBuffer);

      // Convert to voice note
      await new Promise((resolve, reject) => {
        ffmpeg(tempPath)
          .audioCodec("libopus")
          .format("opus")
          .audioBitrate("64k")
          .save(voicePath)
          .on("end", resolve)
          .on("error", reject);
      });

      const voiceBuffer = fs.readFileSync(voicePath);

      // Send voice note to channel (@newsletter)
      await conn.sendMessage(channelJid, {
        audio: voiceBuffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
      });

      // Cleanup
      fs.unlinkSync(tempPath);
      fs.unlinkSync(voicePath);

      await reply(
        `✔️ Song "${meta.title}" sent successfully to the channel!`
      );
    } catch (err) {
      console.error("csong error:", err);
      reply("⚠️ An error occurred while sending the song to the channel.");
    }
  }
);
