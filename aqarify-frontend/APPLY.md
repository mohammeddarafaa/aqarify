# Aqarify — White-Label Frontend Patches · Apply Guide

## What changed

| File | What it does |
|------|-------------|
| `components/shared/sidebar.tsx` | Wide labeled sidebar, role-based sections, tenant logo + app name, no hardcoded Arabic strings |
| `components/shared/topbar.tsx` | i18n logout/search, dark mode toggle, language toggle, realtime bell |
| `components/shared/empty-state.tsx` | Shared empty state used by all dashboards instead of hardcoded demo numbers |
| `components/shared/tenant-document-title.tsx` | Sets `<title>Page — AppName</title>` from tenant config |
| `features/admin/pages/admin-settings-page.tsx` | Full branding panel: logo/favicon upload, colors, content editor, feature toggles, localization |
| `features/landing/components/navbar.tsx` | No hardcoded "Real Estate" — all text from tenant config / i18n |
| `features/landing/components/hero-section.tsx` | All text from `tenant_ui_config.content` |
| `app/layouts/auth-layout.tsx` | Tenant logo + brand on login/register page |
| `hooks/use-tenant-ui.ts` | Enhanced hook: appName, tagline, content, feature(), isRtl, currency |
| `i18n/ar/common.json` | All nav labels, role names, topbar strings — no hardcoded Arabic in TSX |
| `i18n/en/common.json` | English counterparts |

---

## Apply steps

```bash
# 1. Copy all files
cp -r patches/frontend/src/* client/src/

# 2. Verify no TypeScript errors
cd client && npx tsc --noEmit

# 3. Update i18n files (merge, do not replace existing keys)
# The common.json files ADD keys — merge manually or with jq:
jq -s '.[0] * .[1]' client/src/i18n/ar/common.json patches/frontend/src/i18n/ar/common.json \
  > /tmp/common_ar.json && mv /tmp/common_ar.json client/src/i18n/ar/common.json

jq -s '.[0] * .[1]' client/src/i18n/en/common.json patches/frontend/src/i18n/en/common.json \
  > /tmp/common_en.json && mv /tmp/common_en.json client/src/i18n/en/common.json
```

---

## New admin capabilities (Branding + Content tabs)

After applying, the Admin → إعدادات المنصة page has:

| Tab | New controls |
|-----|-------------|
| **الهوية البصرية** | Logo upload, Favicon upload, App name, Tagline, Primary/Secondary/Accent colors, Font family, Border radius, Live color preview |
| **المحتوى** | Hero title, Hero subtitle, Hero description, Featured title, Value statement, Contact title, Contact description, CTA title, CTA description |
| **اللغة والمنطقة** | Default locale, Timezone, Fallback currency + Feature flag toggles (Map view, Waitlist, Leads pipeline, Exports) |

All values are saved to `tenants.ui_config` (JSONB) and `tenants.theme_config` (JSONB) and read by `useTenantUi()` / `useTenantTheme()` at runtime with zero redeploy.

---

## Server-side: logo/favicon upload endpoint required

The branding tab calls `POST /admin/tenant/assets`. Add to `admin.routes.ts`:

```typescript
import { imageUpload, processImageUpload } from "../middleware/imageUpload";

adminRoutes.post(
  "/tenant/assets",
  imageUpload.single("file"),
  processImageUpload,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const type = req.body.type as "logo" | "favicon";
      const ext  = "webp";
      const path = `tenants/${req.tenantId}/${type}.${ext}`;
      const { error } = await supabaseAdmin.storage
        .from("tenant-assets")
        .upload(path, req.processedImage!, {
          contentType: "image/webp",
          upsert: true,
        });
      if (error) throw error;
      const { data: urlData } = supabaseAdmin.storage
        .from("tenant-assets")
        .getPublicUrl(path);
      // Save to tenants row
      const col = type === "logo" ? "logo_url" : "favicon_url";
      await supabaseAdmin
        .from("tenants")
        .update({ [col]: urlData.publicUrl })
        .eq("id", req.tenantId);
      return sendSuccess(res, { url: urlData.publicUrl });
    } catch (err) {
      return next(err);
    }
  },
);
```

---

## White-label checklist

- [ ] Sidebar shows tenant logo/name (not Aqarify)
- [ ] Document `<title>` reads tenant app name
- [ ] Login page shows tenant logo and hero title
- [ ] Public navbar shows tenant logo; no hardcoded "Real Estate" text
- [ ] Hero section shows tenant `content.*` strings
- [ ] Feature flags (map, waitlist, leads, exports) respected in UI
- [ ] Dark mode toggle works
- [ ] RTL/LTR switch works for both Arabic and English
- [ ] Empty state shown on all dashboards with zero data (no demo numbers)
- [ ] Admin can upload logo, change colors, edit content without code changes
