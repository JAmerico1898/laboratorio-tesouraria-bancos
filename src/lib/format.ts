function toBrazilian(formatted: string): string {
  return formatted.replace(/,/g, "X").replace(/\./g, ",").replace(/X/g, ".");
}

export function fmtBrl(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e9) {
    const parts = (v / 1e9).toFixed(4).split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const s = `R$ ${intPart}.${parts[1]}`;
    return toBrazilian(s) + " bi";
  }
  if (abs >= 1e6) {
    const parts = (v / 1e6).toFixed(4).split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const s = `R$ ${intPart}.${parts[1]}`;
    return toBrazilian(s) + " mi";
  }
  const parts = v.toFixed(4).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const s = `R$ ${intPart}.${parts[1]}`;
  return toBrazilian(s);
}

export function fmtPct(v: number, decimals: number = 2): string {
  const parts = v.toFixed(decimals).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const s = decimals > 0 ? `${intPart}.${parts[1]}%` : `${intPart}%`;
  return toBrazilian(s);
}

export function fmtNum(v: number): string {
  const parts = v.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return toBrazilian(`${intPart}.${parts[1]}`);
}
