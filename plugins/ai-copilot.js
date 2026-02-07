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
TEL;type=CELL;type=VOICE;waid=94762095304:+94762095304
END:VCARD`
        }
    }
};



cmd({
    pattern: "copilot",
    alias: [ "ai1" ],
    desc: "Chat with an AI model",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("🧠 Please provide a message for the AI.\n\nExample: `.copilot Hello`");

        // ✅ Updated API URL (Malvin API)
        const apiUrl = `https://malvin-api.vercel.app/ai/copilot?text=${encodeURIComponent(q)}`;

        const { data } = await axios.get(apiUrl);

        if (!data?.status || !data?.result) {
            await react("❌");
            return reply("AI failed to respond. Please try again later.");
        }

        // 🧾 Format the response nicely
        const responseMsg = `
🤖 *Microsoft Copilot AI Response*  
━━━━━━━━━━━━━━━  
${data.result}  

> © Powerd by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`.trim();

        await reply(responseMsg);
        await react("✅");
    } catch (e) {
        console.error("Error in AI command:", e);
        await react("❌");
        reply("An error occurred while communicating with the AI.");
    }
});
