const config = require('../config');
const {cmd , commands} = require('../command');
const axios = require ("axios");

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
    pattern: "lyrics",
    desc: "Get song lyrics",
    category: "tools",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) {
            return reply(
                "Please provide a song title.\n\nExample: .lirik Lelena"
            );
        }

        const apiUrl = `https://apis.sandarux.sbs/api/search/lyrics?apikey=darknero&title=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.title || !data.lyrics) {
            await react("❌");
            return reply("Lyrics not found.");
        }

        let text = `🔍 *Lyrics Track Found* 🎵\n\n`;
        text += `*📝 Name / TrackName:* ${data.title}\n`;
        text += `*🕵️ ArtistName:* ${data.artist}\n`;
        text += `*💽 AlbumName:* ${data.album}\n`;
        text += `*📃 PlainLyrics:*\n ${data.lyrics}\n\n`;
        text += `*📊 SyncedLyrics:*\n ${data.syncedLyrics}\n\n`;
        text += `> © Powerd by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`;
       
            await conn.sendMessage(
            from,
            { text: text },
            { quoted: fakevCard }
        );

        await react("✅");

    } catch (e) {
        console.error("Lirik Error:", e);
        await react("❌");
        reply("An error occurred while fetching lyrics.");
    }
});
