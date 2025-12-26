const { cmd } = require("../command");
const config = require('../config');
const fetch = require("node-fetch");
const axios = require("axios");
// ================== API KEY ==================
const BOT_API_KEY = "ADD_YOUR_API_KEY_HERE"; // asitha.top key

// ================== COMMAND ==================
cmd({
    pattern: "reactch",
    alias: ["rch", "creact"],
    desc: "Bot self only multi react to channel",
    category: "owner",
    filename: __filename
}, async (conn, m) => {
    try {
        // 🔐 SELF ONLY
        if (!m.fromMe) return;

        // 📝 READ MESSAGE TEXT SAFELY
        const text =
            m.text ||
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            "";

        const args = text.trim().split(/\s+/).slice(1);

        // ❌ USAGE CHECK
        if (args.length < 2) {
            return m.reply(
`❌ *Usage:*
.reactch <CHANNEL_LINK> <EMOJI1>|<EMOJI2>|<EMOJI3>

📌 *Example:*
.reactch https://whatsapp.com/channel/xxxxx 🔥|😍|😂`
            );
        }

        // 🔗 CHANNEL LINK
        const channelLink = args[0];

        // 😀 EMOJI LIST
        const emojis = args
            .slice(1)
            .join(" ")
            .split("|")
            .map(e => e.trim())
            .filter(e => e.length > 0);

        if (emojis.length === 0) {
            return m.reply("❌ Emojis not found!");
        }

        let success = 0;
        let failed = 0;

        // 🔄 LOOP EMOJIS
        for (const emoji of emojis) {
            const apiUrl =
`https://react.whyux-xec.my.id/api/rch?link=${encodeURIComponent(channelLink)}&emoji=${encodeURIComponent(emoji)}`;

            try {
                const res = await fetch(apiUrl, {
                    method: "GET",
                    headers: {
                        "x-api-key": BOT_API_KEY,
                        "accept": "application/json"
                    }
                });

                const data = await res.json().catch(() => null);

                if (data && data.success === true) {
                    success++;
                } else {
                    failed++;
                }

                // ⏳ SAFE DELAY (ANTI SPAM)
                await new Promise(resolve => setTimeout(resolve, 700));

            } catch (err) {
                console.error("REACT ERROR:", err);
                failed++;
            }
        }

        // ✅ RESULT MESSAGE
        return m.reply(
`🤖 *MULTI REACT DONE*
━━━━━━━━━━━━━━
🔗 *Channel:* ${channelLink}
😀 *Emojis:* ${emojis.join(" ")}
✅ *Success:* ${success}
❌ *Failed:* ${failed}`
        );

    } catch (err) {
        console.error("REACTCH FATAL ERROR:", err);
        return m.reply("⚠️ React command crashed!");
    }
});
