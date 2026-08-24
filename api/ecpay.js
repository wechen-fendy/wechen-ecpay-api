const crypto = require('crypto');

module.exports = async (req, res) => {
  // 這四行就是幫你網站開門的 CORS 關鍵指令
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
  const itemName = req.body.itemName || 'WECHEN_Product';
  const cartId = req.body.cartId || '';

  const MerchantID = '3002607';
  const HashKey = 'pwFHCqoQZGmho4w6';
  const HashIV = 'EkRm7iFT261dpe0j';
  const ReturnURL = 'https://wechen.tw/api/ecpay/return';
  const ClientBackURL = 'https://wechen.tw/store';

  const tradeNo = `WECHEN${new Date().getTime()}`;
  const date = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false }).replace(/-/g, '/');

  const params = {
    MerchantID,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: date,
    PaymentType: 'aio',
    TotalAmount: amount,
    TradeDesc: 'WECHEN_Order',
    ItemName: itemName,
    ReturnURL,
    ChoosePayment: 'ALL',
    EncryptType: 1,
    ClientBackURL,
  };

  const keys = Object.keys(params).sort();
  let checkMacStr = `HashKey=${HashKey}`;
  for (const key of keys) {
    checkMacStr += `&${key}=${params[key]}`;
  }
  checkMacStr += `&HashIV=${HashIV}`;

  checkMacStr = encodeURIComponent(checkMacStr).toLowerCase();
  checkMacStr = checkMacStr.replace(/%20/g, '+')
                           .replace(/%2d/g, '-')
                           .replace(/%5f/g, '_')
                           .replace(/%2e/g, '.')
                           .replace(/%21/g, '!')
                           .replace(/%2a/g, '*')
                           .replace(/%28/g, '(')
                           .replace(/%29/g, ')');

  const CheckMacValue = crypto.createHash('sha256').update(checkMacStr).digest('hex').toUpperCase();
  params.CheckMacValue = CheckMacValue;

  let formHtml = `<form id="ecpay-form" method="POST" action="https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5">`;
  for (const key in params) {
    formHtml += `<input type="hidden" name="${key}" value="${params[key]}" />`;
  }
  formHtml += `</form>`;

  res.status(200).json({ formHtml });
};
