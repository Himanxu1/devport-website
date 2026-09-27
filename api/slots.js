// GET /api/slots → { limit, sold, left, launch, price, regularPrice }
const { pricing } = require("./_pricing");

module.exports = async (req, res) => {
  try {
    const p = await pricing();
    delete p.productId;
    // Near-real-time: Vercel's edge serves this for 20 s, then refreshes in the background.
    res.setHeader("Cache-Control", "public, s-maxage=20, stale-while-revalidate=60");
    res.status(200).json(p);
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(503).json({ error: "unavailable" });
  }
};
