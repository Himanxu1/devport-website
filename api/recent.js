// GET /api/recent → { events: [{ country: "DE", at: "2026-09-27T11:12:05Z" }, …] }
//
// Real DevPort purchases from the last 14 days, newest first, for the
// "Someone in Germany bought DevPort" toast. Only a country code and a time
// leave this function: never a name, email, city or amount. $0 orders (tests,
// 100% discount codes) and refunded licences are skipped. No sales → no events,
// and the site shows no toast.
const { LAUNCH_PRODUCT_ID } = require("./_pricing");
const DODO = "https://live.dodopayments.com";
const WINDOW_MS = 14 * 24 * 3600 * 1000;

module.exports = async (req, res) => {
  const key = process.env.DODO_API_KEY;
  const products = [LAUNCH_PRODUCT_ID, process.env.REGULAR_PRODUCT_ID].filter(Boolean);
  const auth = { headers: { Authorization: `Bearer ${key}` } };
  try {
    if (!key) throw new Error("DODO_API_KEY is not set");
    let keys = [];
    for (const id of products) {
      const r = await fetch(`${DODO}/license_keys?product_id=${id}&page_size=20`, auth);
      if (!r.ok) throw new Error(`Dodo answered ${r.status}`);
      keys = keys.concat((await r.json()).items || []);
    }
    const since = Date.now() - WINDOW_MS;
    keys = keys
      .filter((k) => k.status !== "disabled" && k.payment_id && Date.parse(k.created_at) > since)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 8);

    const events = [];
    for (const k of keys) {
      const r = await fetch(`${DODO}/payments/${k.payment_id}`, auth);
      if (!r.ok) continue;
      const p = await r.json();
      if (!p.total_amount) continue; // tests and free orders are not purchases
      events.push({ country: (p.billing && p.billing.country) || null, at: k.created_at });
    }
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ events });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(503).json({ events: [] });
  }
};
