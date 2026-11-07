import QRCode from "qrcode";
import { getPublicSiteUrl } from "@/lib/site-url";

export async function GET(req: Request) {
  try {
    const requested = new URL(req.url).searchParams.get("url") || "";
    const siteUrl = getPublicSiteUrl(req);
    let target: URL | null = null;
    try {
      target = new URL(requested);
    } catch {
      target = null;
    }
    if (
      !target ||
      requested.length > 500 ||
      target.origin !== siteUrl ||
      !target.pathname.startsWith("/book/")
    ) {
      return new Response("Invalid URL", { status: 400 });
    }

    const svg = await QRCode.toString(target.toString(), {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 1,
      width: 320,
      color: { dark: "#0a0a0a", light: "#fffaf0" },
    });

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("Could not create QR", { status: 500 });
  }
}
