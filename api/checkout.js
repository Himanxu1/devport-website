// GET /api/checkout?from=app|web → 302 to the Dodo checkout for the current price.
//
// from=app returns to devport://activated so the app activates itself after
// payment; anything else returns to this site's /thanks page. Only these two
// destinations are possible, so this cannot be used as an open redirect.
const { pricing, LAUNCH_PRODUCT_ID } = require("./_pricing");

module.exports = async (req, res) => {
  let productId = LAUNCH_PRODUCT_ID;
  try { productId = (await pricing()).productId; } catch (e) { /* Dodo unreachable: sell at launch price */ }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const back = req.query.from === "app" ? "devport://activated" : `https://${host}/thanks`;

  const url = new URL(`https://checkout.dodopayments.com/buy/${productId}`);
  url.searchParams.set("quantity", "1");
  url.searchParams.set("redirect_url", back);
  res.setHeader("Cache-Control", "no-store");
  res.writeHead(302, { Location: url.toString() });
  res.end();
};
