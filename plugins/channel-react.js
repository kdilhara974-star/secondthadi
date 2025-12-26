const fetch = require("node-fetch");
const { cmd } = require("../command");

const BOT_API_KEY = "ADD_YOUR_API_KEY_HERE";

cmd({
  pattern: "rch",
  react: "🤖",
  desc: "Owner Only: Multi react to latest channel post",
  category: "owner",
  use: ".rch <channel_link> <emoji1>|<emoji2> OR .rch latest <emoji1>|<emoji2>",
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
.rch <channel_link> <emoji1>|<emoji2>
OR
.rch latest <emoji1>|<emoji2>`
      );
    }

    let channelLink = args[0];
    const emojis = args.slice(1).join(" ").split("|").map(e => e.trim()).filter(Boolean);

    if (!emojis.length) return reply("❌ Emojis not found!");

    // 🔎 LATEST POST DETECTION
    if (channelLink.toLowerCase() === "latest") {
      // replace "latest" with channel link from config / default
      if (!config.defaultChannelLink) return reply("⚠️ Default channel not set in config!");
      channelLink = config.defaultChannelLink;

      // fetch latest post link from API
      try {
        const res = await fetch(`https://react.whyux-xec.my.id/api/latest?link=${encodeURIComponent(channelLink)}`, {
          headers: { "x-api-key": BOT_API_KEY }
        });
        const data = await res.json();
        if (!data?.success || !data?.latest) return reply("❌ Could not fetch latest post!");
        channelLink = data.latest; // latest post link
      } catch {
        return reply("❌ Failed to fetch latest post!");
      }
    }

    let success = 0;
    let failed = 0;

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    for (const emoji of emojis) {
      try {
        const res = await fetch(
          `https://react.whyux-xec.my.id/api/rch?link=${encodeURIComponent(channelLink)}&emoji=${encodeURIComponent(emoji)}`,
          { headers: { "x-api-key": BOT_API_KEY } }
        );
        const data = await res.json().catch(() => null);
        if (data?.success) success++;
        else failed++;
        await new Promise(r => setTimeout(r, 700));
      } catch {
        failed++;
      }
    }

    return reply(
`🤖 *MULTI REACT DONE*
━━━━━━━━━━━━━━
🔗 Channel/Post: ${channelLink}
😀 Emojis: ${emojis.join(" ")}
✅ Success: ${success}
❌ Failed: ${failed}`
    );

  } catch (err) {
    console.error(err);
    return reply("❌ React command failed!");
  }
});
