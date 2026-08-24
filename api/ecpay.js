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
  // 確保品名長度符合綠界規範
  const itemName = (req.body.itemName || 'WECHEN_Product').substring(0, 50);

  // 改用綠界官方最穩定的萬用測試帳號
  const MerchantID = '2000132';
  const HashKey = '5294y06JbISpM5x9';
  const HashIV = 'v77hoKGq4kWxNNIS';
  const ReturnURL = 'https://wechen.tw/api/ecpay/return';
  const ClientBackURL = 'https://wechen.tw/store';

  const tradeNo = `WECHEN${new Date().getTime()}`;

  // 完美強制格式化時間為 YYYY/MM/DD HH:mm:ss (解決 Vercel 時間偏差問題)
  const d = new Date(new Date().getTime() + 8 * 3600 * 1000);
  const date = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`;

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

  let formHtml = `<form id="ecpay-form" target="_top" method="POST" action="https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5">`;
  for (const key in params) {
    formHtml += `<input type="hidden" name="${key}" value="${params[key]}" />`;
  }
  formHtml += `</form>`;

  res.status(200).json({ formHtml });
};
