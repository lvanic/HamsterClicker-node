export function formatNumber(num: number) {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(2)}b`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}m`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}k`;
  } else {
    return num.toFixed(0);
  }
}
