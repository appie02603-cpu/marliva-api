export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { store, token, days } = req.query;
  if (!store || !token) return res.status(400).json({ error: 'store en token verplicht' });
  const since = new Date(Date.now() - (days || 30) * 86400000).toISOString();
  try {
    const r = await fetch(`https://${store}/admin/api/2024-01/orders.json?status=any&created_at_min=${since}&limit=250&fields=id,name,total_price,financial_status,line_items`, { headers: { 'X-Shopify-Access-Token': token } });
    if (!r.ok) return res.status(r.status).json({ error: `Shopify fout ${r.status}` });
    const data = await r.json();
    const orders = data.orders || [];
    const revenue = orders.reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
    const aov = orders.length ? revenue / orders.length : 0;
    const prodMap = {};
    orders.forEach(o => (o.line_items || []).forEach(li => { prodMap[li.title] = (prodMap[li.title] || 0) + parseFloat(li.price || 0) * li.quantity; }));
    const topProds = Object.entries(prodMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const recentOrders = orders.slice(0, 6).map(o => ({ name: o.name, total: parseFloat(o.total_price || 0), status: o.financial_status }));
    res.status(200).json({ revenue, orders: orders.length, aov, topProds, recentOrders });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
