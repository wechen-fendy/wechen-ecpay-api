const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const amount = Math.round(req.body.amount || 0);
  const itemName = (req.body.itemName || 'WECHEN_Product').substring(0, 50);

  const MerchantID = '2000132';
  const HashKey = '5294y06JbISpM5x9';
  const HashIV = 'v77hoKGq4kWxNNIS';
  const ReturnURL = 'https://wechen.tw/api/ecpay/return';
  const ClientBackURL = 'https://wechen.tw';

  const tradeNo = `WEC${Date.now()}`;
  const d = new Date(new Date().getTime() + (8 * 60 * 60 * 1000));
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  const date = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  
  const params = {
    MerchantID,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: date,
    PaymentType: 'aio',
    TotalAmount: amount,
    TradeDesc: 'WECHEN_Order',
    ItemName: itemName,
    ReturnURL,
    ChoosePayment: 'Credit',
    ClientBackURL,
  };

  const checkMacValue = generateCheckMacValue(params, HashKey, HashIV);

  const htmlForm = `
    <form id="ecpay-form" method="POST" target="_top" action="https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5">
      ${Object.keys(params).map(key => `<input type="hidden" name="${key}" value="${params[key]}">`).join('')}
      <input type="hidden" name="CheckMacValue" value="${checkMacValue}">
    </form>
  `;

  return res.status(200).json({ formHtml: htmlForm });
};

function generateCheckMacValue(params, HashKey, HashIV) {
  const sortedKeys = Object.keys(params).sort();
  let checkString = `HashKey=${HashKey}&` + sortedKeys.map(key => `${key}=${params[key]}`).join('&') + `&HashIV=${HashIV}`;
  const encoded = encodeURIComponent(checkString).toLowerCase();
  const replacements = {
    '%20': '+', '%21': '!', '%2a': '*', '%27': "'", '%28': '(', '%29': ')',
    '%2d': '-', '%2e': '.', '%5f': '_', '%7e': '~', '%2b': '+', '%3d': '=',
    '%26': '&', '%3f': '?', '%23': '#', '%2f': '/'
  };
  const fixed = encoded.replace(/%[0-9a-f]{2}/gi, match => replacements[match] || match);
  return crypto.createHash('sha256').update(fixed).digest('hex').toUpperCase();
}
