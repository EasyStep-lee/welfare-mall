function formatMoney(amount) {
  return `¥${(amount / 100).toFixed(2)}`;
}

function joinOrigin(origin) {
  if (!origin) {
    return '';
  }

  return [origin.country, origin.province, origin.city].filter(Boolean).join(' / ');
}

module.exports = {
  formatMoney,
  joinOrigin
};
