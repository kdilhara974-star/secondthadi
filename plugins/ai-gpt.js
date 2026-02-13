const { cmd } = require('../command');
const axios = require('axios');

// Fake ChatGPT vCard
const fakevCard = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: "© Mr Hiruka",
            vcard: `BEGIN:VCARD
VERSION:3.0
FN:Meta
ORG:META AI;
TEL;type=CELL;type=VOICE;waid=18002428478:+18002428478
END:VCARD`
        }
    }
};


cmd({
    pattern: "gpt",
    alias: [ "ai2", "chatgpt", "openai" ],
    desc: "Chat with Microsoft Copilot - GPT-5",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) {
            return reply("🧠 Please provide a message for the AI.\nExample: `.gpt Hello`");
        }

        // ✅ Malvin API - GPT-5 Endpoint
        const apiUrl = `https://malvin-api.vercel.app/ai/gpt-5?text=${encodeURIComponent(q)}`;

        const { data } = await axios.get(apiUrl);

        // 🧾 Validate Response
        if (!data?.status || !data?.result) {
            await react("❌");
            return reply("AI failed to respond. Please try again later.");
        }

        // 🧩 Nicely formatted response
        const responseMsg = `
🤖 *Microsoft Copilot GPT-latest AI Response*  
━━━━━━━━━━━━━━━  
${data.result}`.trim();

            await conn.sendMessage(
      from,
      { text: responseMsg },
      { quoted: fakevCard }
    );

    await react("✅");

  } catch (e) {
    console.log("GPT-5 Error:", e.message);
  }
});
