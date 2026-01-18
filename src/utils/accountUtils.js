export function getMaxAccountIndex(accounts) {
  if (accounts.length === 0) return -1;
  return Math.max(...accounts.map(a => a.index));
}

export function accountExists(accounts, index) {
  return accounts.some(a => a.index === index);
}
