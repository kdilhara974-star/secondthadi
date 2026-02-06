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
            displayName: "© Ranumitha",
            vcard: `BEGIN:VCARD
VERSION:3.0
FN:RANUMITHA
ORG:RANUMITHA-X-MD;
TEL;type=CELL;type=VOICE;waid=null:null
END:VCARD`
        }
    }
};

cmd({
    pattern: "tiktok",
    alias: ["ttdl", "tt", "tiktokdl"],
    desc: "Download TikTok video with full details and numbered options",
    category: "downloader",
    react: "🎥",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        // ✅ Get TikTok link from command or replied message
        let tiktokUrl = q?.trim();
        if (!tiktokUrl && mek?.quoted) {
            tiktokUrl =
                mek.quoted.message?.conversation ||
                mek.quoted.message?.extendedTextMessage?.text ||
                mek.quoted.text;
        }

        if (!tiktokUrl || !tiktokUrl.includes("tiktok.com")) {
            return reply("⚠️ Please provide a valid TikTok link (or reply to a message).");
        }

        await conn.sendMessage(from, { react: { text: '🎥', key: mek.key } });

        // ✅ Fetch TikTok info
        const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(tiktokUrl)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.data) return reply("❌ Failed to fetch TikTok video.");

        const { title, author, like, comment, share, meta } = data.data;

        const videoNoWatermark = meta.media.find(v => v.type === "video")?.org;
        const videoWithWatermark = meta.media.find(v => v.type === "video")?.wm || videoNoWatermark;
        const audioUrl = meta.music?.playUrl || videoNoWatermark;
        const musicTitle = meta.music?.title || "Original Sound";
        const duration = meta.duration || "Unknown";
        const thumbnail = meta.media.find(v => v.type === "video")?.cover || 
                         "https://raw.githubusercontent.com/Ranumithaofc/RANU-FILE-S-/refs/heads/main/images/RANUMITHA-X-MD%20TIKTOK%20LOGO.jpg";

        // 1️⃣ Send menu with full details and video thumbnail
        const caption = `*🍇 RANUMITHA-X-MD TIKTOK DOWNLOADER 🍇*

👤 \`User:\` ${author.nickname}
📖 \`Title:\` ${title}
⏱️ \`Duration:\` ${duration}
🎵 \`Music:\` ${musicTitle}
👍 \`Likes:\` ${like} 
💬 \`Comments:\` ${comment} 
🔁 \`Shares:\` ${share}
🔗 \`Link:\` ${tiktokUrl}

💬 *Reply with your choice:*

1️⃣ No Watermark 🎟️
2️⃣ With Watermark 🎫
3️⃣ Audio Only 🎶

> © Powered by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`;

        const sentMsg = await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: caption
        }, { quoted: fakevCard });

        const menuMessageID = sentMsg.key.id;

        // Create a one-time listener for this specific menu
        const replyHandler = async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message) return;

            const receivedText = receivedMsg.message.conversation || 
                                receivedMsg.message.extendedTextMessage?.text ||
                                receivedMsg.message.extendedTextMessage?.text;
            const senderID = receivedMsg.key.remoteJid;
            const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === menuMessageID;

            if (isReplyToMenu && senderID === from) {
                // Remove listener after receiving reply
                conn.ev.off("messages.upsert", replyHandler);

                let mediaUrl, isAudio = false, captionText;

                switch (receivedText.trim()) {
                    case "1":
                        mediaUrl = videoNoWatermark;
                        captionText = `*TikTok Video (No Watermark)* 🫧\n\n👤 *User:* ${author.nickname}\n📖 *Title:* ${title}\n⏱️ *Duration:* ${duration}`;
                        break;
                    case "2":
                        mediaUrl = videoWithWatermark;
                        captionText = `*TikTok Video (With Watermark)* 🫧\n\n👤 *User:* ${author.nickname}\n📖 *Title:* ${title}\n⏱️ *Duration:* ${duration}`;
                        break;
                    case "3":
                        mediaUrl = audioUrl;
                        isAudio = true;
                        captionText = `*TikTok Audio* 🎶\n\n👤 *User:* ${author.nickname}\n🎵 *Music:* ${musicTitle}\n⏱️ *Duration:* ${duration}`;
                        break;
                    default:
                        return conn.sendMessage(from, { 
                            text: "*❌ Invalid option! Please reply with 1, 2, or 3.*" 
                        }, { quoted: receivedMsg });
                }

                // ⬇️ React when download starts
                await conn.sendMessage(from, { react: { text: '⬇️', key: receivedMsg.key } });

                try {
                    if (isAudio) {
                        await conn.sendMessage(from, {
                            audio: { url: mediaUrl },
                            mimetype: "audio/mp4",
                            ptt: false,
                            caption: captionText
                        }, { quoted: receivedMsg });
                    } else {
                        // Video eke thumbnail ekak set karanna
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            mimetype: "video/mp4",
                            caption: captionText,
                            jpegThumbnail: thumbnail ? await (await axios.get(thumbnail, { responseType: 'arraybuffer' })).data : undefined
                        }, { quoted: receivedMsg });
                    }

                    // ✅ React after upload complete
                    await conn.sendMessage(from, { react: { text: '✅', key: receivedMsg.key } });

                } catch (error) {
                    console.error("Error sending media:", error);
                    await conn.sendMessage(from, { react: { text: '❌', key: receivedMsg.key } });
                    conn.sendMessage(from, { 
                        text: "*❌ Failed to send media. Please try again.*" 
                    }, { quoted: receivedMsg });
                }
            }
        };

        // Set timeout to remove listener after 60 seconds
        setTimeout(() => {
            conn.ev.off("messages.upsert", replyHandler);
        }, 60000);

        // Add the listener
        conn.ev.on("messages.upsert", replyHandler);

    } catch (e) {
        console.error("TikTok plugin error:", e);
        reply("*❌ Error downloading TikTok video.*");
    }
});
