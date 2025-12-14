const { cmd } = require('../command');

cmd({
    pattern: "kick",
    alias: ["remove", "k"],
    desc: "Removes a user from the group by reply or mention",
    category: "admin",
    react: "❌",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        if (!from.endsWith("@g.us")) return reply("📛 *Group only command!*");

        // Fetch group metadata
        const metadata = await conn.groupMetadata(from);
        const participants = metadata.participants || [];

        // Correct sender detection
        const senderJid = mek.key?.fromMe ? conn.user.id.split(":")[0]+"@s.whatsapp.net" : mek.key?.participant;
        const botJid = conn.user.id.split(":")[0]+"@s.whatsapp.net";

        const sender = participants.find(p => p.id === senderJid);
        const bot = participants.find(p => p.id === botJid);

        // Admin checks (handle null)
        const isSenderAdmin = sender?.admin === "admin" || sender?.admin === "superadmin";
        const isBotAdmin = bot?.admin === "admin" || bot?.admin === "superadmin";

        if (!isSenderAdmin) return reply("📛 *You must be a group admin!*");
        if (!isBotAdmin) return reply("📛 *Bot must be admin to remove users!*");

        // Determine target
        let targetJid;
        const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentioned?.length) {
            targetJid = mentioned[0];
        } else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = mek.message.extendedTextMessage.contextInfo.participant;
        } else {
            return reply("⚠️ *Reply to a user or @mention them to kick!*");
        }

        // Prevent bot self-kick
        if (targetJid === botJid) return reply("😅 *I can't remove myself!*");

        // Remove participant
        await conn.groupParticipantsUpdate(from, [targetJid], "remove");

        await conn.sendMessage(from, {
            text: `✅ *Removed:* @${targetJid.split("@")[0]}`,
            mentions: [targetJid]
        });

    } catch (err) {
        console.error("Kick Error:", err);
        reply("❌ *Failed to remove user!*");
    }
});
