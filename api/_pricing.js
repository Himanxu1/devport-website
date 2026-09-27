// Shared launch-pricing logic for /api/slots and /api/checkout.
//
// The first SLOT_LIMIT licences sell on the launch product ($3.50). After that,
// checkout switches to the regular product ($8). Sales are counted from Dodo's
// licence keys for the launch product, so the number is exact, not estimated.
//
// Vercel environment variables:
//   DODO_API_KEY         required — read-only use: GET /license_keys
//   REGULAR_PRODUCT_ID   the $8 product; until it is set, checkout stays on launch
const LAUNCH_PRODUCT_ID = "pdt_0NoQZXsQrLCafVXr53l5H";
const SLOT_LIMIT = 400;
const LAUNCH_PRICE = "$3.50";
const REGULAR_PRICE = "$8";
const DODO = "https://live.dodopayments.com";

// Refunded licences are disabled in Dodo and free their slot again.
async function countSold() {
  const key = process.env.DODO_API_KEY;
  if (!key) throw new Error("DODO_API_KEY is not set");
  let sold = 0;
  for (let page = 0; page < 10; page++) {
    const url = `${DODO}/license_keys?product_id=${LAUNCH_PRODUCT_ID}&page_size=100&page_number=${page}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`Dodo answered ${res.status}`);
    const items = (await res.json()).items || [];
    sold += items.filter((k) => k.status !== "disabled").length;
    if (items.length < 100) break;
  }
  return sold;
}

async function pricing() {
  const sold = await countSold();
  const left = Math.max(0, SLOT_LIMIT - sold);
  const regularReady = Boolean(process.env.REGULAR_PRODUCT_ID);
  // Only move to the regular price once there is a regular product to sell.
  const launch = left > 0 || !regularReady;
  return {
    limit: SLOT_LIMIT,
    sold: Math.min(sold, SLOT_LIMIT),
    left,
    launch,
    price: launch ? LAUNCH_PRICE : REGULAR_PRICE,
    regularPrice: REGULAR_PRICE,
    productId: launch ? LAUNCH_PRODUCT_ID : process.env.REGULAR_PRODUCT_ID,
  };
}

module.exports = { pricing, LAUNCH_PRODUCT_ID, LAUNCH_PRICE };
