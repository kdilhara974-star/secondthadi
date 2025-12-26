const { cmd } = require("../command");
const config = require("../config");

// ---------------- CONFIG ----------------
const DEFAULT_CHANNEL_POST = config.defaultChannelPost || "";
const DEFAULT_CHANNEL_JID = config.defaultChannelJid || "";

cmd({
  pattern: "rch",
  react: "🤖",
  desc: "Owner Only: Multi emoji reply to latest channel post or specific post",
  category: "owner",
  use: ".rch <post_link> <emoji1>|<emoji2> OR .rch latest <emoji1>|<emoji2>",
  filename: __filename
},
async (conn, mek, m, { from, isOwner }) => {

  const reply = async (text) =>
    await conn.sendMessage(from, { text }, { quoted: m });

  if (!isOwner) return reply("🚫 *Owner Only Command!*");

  try {
    const text =
      m.text ||
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      "";

    let args = text.trim().split(/\s+/).slice(1);
    if (args.length < 2) {
      return reply(
`❌ Usage:
.rch <post_link> <emoji1>|<emoji2>
OR
.rch latest <emoji1>|<emoji2>`
      );
    }

    // ---------------- POST LINK ----------------
    let postLink = args[0];
    if (postLink.toLowerCase() === "latest") {
      if (!DEFAULT_CHANNEL_POST) return reply("⚠️ Default channel post not set in config!");
      postLink = DEFAULT_CHANNEL_POST;
    }

    // ---------------- JID ----------------
    const postJid = DEFAULT_CHANNEL_JID;
    if (!postJid) return reply("⚠️ Channel JID not set in config!");

    // ---------------- EMOJIS ----------------
    const emojis = args.slice(1).join(" ").split("|").map(e => e.trim()).filter(Boolean);
    if (!emojis.length) return reply("❌ Emojis not found!");

    let success = 0;
    let failed = 0;

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    // ---------------- SEND EMOJI REPLIES ----------------
    for (const emoji of emojis) {
      try {
        await conn.sendMessage(postJid, { text: emoji }, { quoted: m });
        success++;
        await new Promise(r => setTimeout(r, 500)); // small delay
      } catch (err) {
        console.error(err);
        failed++;
      }
    }

    // ---------------- RESULT ----------------
    return reply(
`🤖 *MULTI EMOJI REPLY DONE*
━━━━━━━━━━━━━━
🔗 Post: ${postLink}
😀 Emojis: ${emojis.join(" ")}
✅ Success: ${success}
❌ Failed: ${failed}`
    );

  } catch (err) {
    console.error(err);
    return reply("❌ Command failed!");
  }
});
