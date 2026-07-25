// এই ফাইলটা সার্ভারে চলে (ব্রাউজারে না), তাই বট টোকেন এখানে নিরাপদ।
// টোকেন আসে Vercel Environment Variables থেকে:
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// (Project Settings → Environment Variables এ বসাতে হয়)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('TELEGRAM_BOT_TOKEN বা TELEGRAM_CHAT_ID সেট করা নেই');
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const order = req.body;

    const itemList = (order.items || [])
      .map(c => `▫️ ${c.name} × ${c.qty}`)
      .join('\n');
    const payMethod = order.payment === 'bkash' ? 'bKash/Nagad' : 'ক্যাশ অন ডেলিভারি';
    const delivArea = order.delivery === 'dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে';

    const text =
`🛒 *নতুন অর্ডার এসেছে!*
🆔 অর্ডার আইডি: \`${order.id}\`

👤 নাম: ${order.name}
📞 ফোন: ${order.phone}
🏠 ঠিকানা: ${order.address}
${order.note ? '📝 নোট: ' + order.note + '\n' : ''}
📦 পণ্য:
${itemList}

🚚 ডেলিভারি: ${delivArea} (৳${order.deliveryCharge})
💳 পেমেন্ট: ${payMethod}${order.txnId ? '\n🔖 TxnID: `' + order.txnId + '`' : ''}
💰 সর্বমোট: ৳${(order.total || 0).toLocaleString()}
🕒 সময়: ${order.time}`;

    const tgResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: text,
          parse_mode: 'Markdown'
        })
      }
    );

    if (!tgResponse.ok) {
      const errData = await tgResponse.text();
      console.error('Telegram API error:', errData);
      return res.status(502).json({ error: 'Failed to send Telegram message' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('notify-order error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
