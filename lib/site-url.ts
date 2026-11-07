const CANONICAL_SITE_URL = "https://muthashi-kadha.vercel.app";

function normalizeSiteUrl(value?: string | null): string | null {
  if (!value) return null;
  const withProtocol = /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1"
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/** Return a public, scannable origin—never a localhost development address. */
export function getPublicSiteUrl(req?: Request): string {
  const forwardedHost = req?.headers.get("x-forwarded-host");
  const forwardedProtocol =
    req?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const requestOrigin = req ? new URL(req.url).origin : null;

  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    forwardedHost ? `${forwardedProtocol}://${forwardedHost}` : null,
    process.env.VERCEL_URL,
    requestOrigin,
    CANONICAL_SITE_URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeSiteUrl(candidate);
    if (normalized) return normalized;
  }
  return CANONICAL_SITE_URL;
}
