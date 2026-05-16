import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { resolveTenant, type TenantRequest } from "../middleware/tenant";
import { logger } from "../utils/logger";

export const seoRoutes = Router();

/**
 * T3-E — Tenant-aware SEO Routes
 *
 * Mount in index.ts (before subscriptionGuard, no auth required):
 *   app.use("/", seoRoutes);
 *
 * Sitemap only lists `available` units to avoid indexing reserved/sold pages
 * that customers can't act on.
 */

// GET /sitemap.xml
seoRoutes.get("/sitemap.xml", resolveTenant, async (req: Request & TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(404).type("text/plain").send("Tenant not found");
      return;
    }

    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("slug, custom_domain")
      .eq("id", tenantId)
      .maybeSingle();

    const { data: units } = await supabaseAdmin
      .from("units")
      .select("id, updated_at")
      .eq("tenant_id", tenantId)
      .eq("status", "available")
      .order("updated_at", { ascending: false })
      .limit(5000);

    const baseUrl = tenant?.custom_domain
      ? `https://${tenant.custom_domain}`
      : `https://${tenant?.slug}.aqarify.io`;

    const lastmod = (d?: string | null) =>
      d ? new Date(d).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

    const urlEntries = (units ?? [])
      .map(
        (u) => `
  <url>
    <loc>${baseUrl}/browse/units/${u.id}</loc>
    <lastmod>${lastmod(u.updated_at)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`,
      )
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/browse</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${urlEntries}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    logger.error("sitemap.xml generation failed", err);
    res.status(500).type("text/plain").send("Failed to generate sitemap");
  }
});

// GET /robots.txt
seoRoutes.get("/robots.txt", (_req: Request, res: Response) => {
  const robots = `User-agent: *
Allow: /
Allow: /browse
Disallow: /dashboard
Disallow: /admin
Disallow: /agent
Disallow: /manager
Disallow: /platform-admin
Disallow: /api/
Disallow: /login
Disallow: /register

Sitemap: /sitemap.xml
`;
  res.type("text/plain").setHeader("Cache-Control", "public, max-age=86400").send(robots);
});
