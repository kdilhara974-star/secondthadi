const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "ai1",
  alias: ["bot", "ranumithaai", "gpt", "gpt4", "bing","ranuai"],
  desc: "Chat with an AI model",
  category: "ai",
  react: "🤖",
  filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
  try {
    if (!q) return reply("Please provide a message for the AI.\nExample: `.ai Hello`");

    const apiUrl = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.message) {
      await react("❌");
      return reply("AI failed to respond. Please try again later.");
    }

    // Start measuring ping for fetching profile picture
    const start = Date.now();

    // Fetch profile picture buffer
    let thumb = Buffer.from([]);
    const number = "18002428478"; // Use your number without spaces or symbols
    const jid = number + "@s.whatsapp.net";

    try {
      const ppUrl = await conn.profilePictureUrl(jid, "image");
      const ppResp = await axios.get(ppUrl, { responseType: "arraybuffer" });
      thumb = Buffer.from(ppResp.data, "binary");
    } catch (err) {
      console.log("❗ Couldn't fetch profile picture:", err.message);
    }

    // Create contact card vCard object
    const contactCard = {
      key: {
        fromMe: false,
        participant: '0@s.whatsapp.net',
        remoteJid: "status@broadcast"
      },
      message: {
        contactMessage: {
          displayName: "GPT 3✅",
          vcard: `BEGIN:VCARD
VERSION:3.0
FN: GPT ✅
ORG: OpenAI
TEL;type=CELL;type=VOICE;waid=${number}:+1 800 242 8478
END:VCARD`,
          jpegThumbnail: thumb
        }
      }
    };

    // Send AI quoted contact card
    await conn.sendMessage(from, {
      text: `🤖 *RANUMITHA-X-MD Ai Response:*\n\n${data.message}`
    }, { quoted: contactCard });

    await react("✅");

  } catch (e) {
    console.error("Error in AI command:", e);
    await react("❌");
    reply("An error occurred while communicating with the AI.");
  }
});
