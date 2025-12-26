const { cmd } = require("../command");

cmd({
  pattern: "chr",
  react: "🤖",
  desc: "React to WhatsApp channel post via link (FAKE)",
  category: "tools",
  use: ".chr <channel_post_link> <emoji>",
  filename: __filename
},
async (conn, mek, m, { from }) => {

  const reply = (text) =>
    conn.sendMessage(from, { text }, { quoted: m });

  // get message text safely
  const body =
    m.text ||
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    "";

  const args = body.trim().split(/\s+/).slice(1);

  if (args.length < 1) {
    return reply(
      "❌ Usage:\n.chr <whatsapp_channel_post_link> <emoji>"
    );
  }

  const postLink = args[0];
  const emoji = args[1] || "💛"; // default emoji

  if (!postLink.includes("whatsapp.com/channel")) {
    return reply("❌ Invalid WhatsApp channel post link!");
  }

  // loading react (bot message)
  await conn.sendMessage(from, {
    react: { text: "⏳", key: m.key }
  });

  // fake delay
  await new Promise(r => setTimeout(r, 1500));

  // final fake success message
  return reply(
`🤖 *CHANNEL REACTION SENT*
━━━━━━━━━━━━━━
🔗 Post Link:
${postLink}

😀 Reaction: ${emoji}
📡 Mode: LINK
⚠️ Type: FAKE (UI)
✅ Status: Done`
  );
});
