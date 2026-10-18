/**
 * Supabase returns the TOTP QR code as raw SVG markup (sometimes as a data
 * URL). Re-encode it as a base64 SVG data URL so <img> can display it; an
 * <img> never runs markup, unlike injecting the SVG into the page.
 */
export function qrImage(qr: unknown) {
  if (typeof qr !== "string" || qr.length > 2_000_000) return undefined;
  if (qr.startsWith("data:image/svg+xml;base64,")) return qr;
  let svg = qr;
  const comma = qr.indexOf(",");
  if (qr.startsWith("data:image/svg+xml") && comma > 0) {
    const body = qr.slice(comma + 1);
    try {
      svg = decodeURIComponent(body);
    } catch {
      svg = body;
    }
  }
  if (!/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/.test(svg)) return undefined;
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}
