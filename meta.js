module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { account, token, days } = req.query;
  if (!account || !token) return res.status(400).json({ error: 'account en token verplicht' });

  const since = new Date(Date.now() - (days || 30) * 86400000).toISOString().slice(0, 10);
  const until = new Date().toISOString().slice(0, 10);

  try {
    const r = await fetch(
      `https://graph.facebook.com/v19.0/act_${account}/insights?fields=spend,impressions,clicks&time_range={"since":"${since}","until":"${until}"}&access_token=${token}`
    );
    const data = await r.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    const d = data.data?.[0] || {};
    res.status(200).json({
      spend: parseFloat(d.spend || 0),
      impressions: parseInt(d.impressions || 0),
      clicks: parseInt(d.clicks || 0)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
