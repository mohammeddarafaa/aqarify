/**
 * T3-G — Batch Encryption Key Rotation Script
 *
 * Run with:
 *   ENCRYPTION_KEYS=v1:oldkey,v2:newkey npx ts-node scripts/rotate-encryption-keys.ts
 *
 * What it does:
 *  1. Fetches all tenants that have encrypted columns.
 *  2. Re-encrypts each column with the current (highest) key version.
 *  3. Skips rows already on the current version.
 *  4. Dry-run mode by default — pass --apply to write.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { rotateCredential, latestEncryptionKeyVersion } from "../src/utils/encryption";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const DRY_RUN = !process.argv.includes("--apply");

async function main() {
  const { label: currentVersion } = latestEncryptionKeyVersion();
  console.log(`Current key version: ${currentVersion}`);
  console.log(DRY_RUN ? "DRY RUN — pass --apply to write changes" : "APPLYING changes");

  const ENCRYPTED_COLUMNS = [
    "paymob_api_key_enc",
    "paymob_hmac_secret_enc",
    "paymob_iframe_id_enc",
  ] as const;

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select(`id, ${ENCRYPTED_COLUMNS.join(", ")}`);

  if (error) throw error;

  let rotated = 0;
  let skipped = 0;

  for (const tenant of tenants ?? []) {
    const updates: Record<string, string> = {};

    for (const col of ENCRYPTED_COLUMNS) {
      const value = (tenant as Record<string, string | null>)[col];
      if (!value) continue;
      try {
        const rotated_ = rotateCredential(value);
        if (rotated_ !== value) {
          updates[col] = rotated_;
        }
      } catch (err) {
        console.error(`  ✗ tenant ${tenant.id} col ${col}: decrypt failed —`, err);
      }
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    console.log(`  → tenant ${tenant.id}: rotating columns [${Object.keys(updates).join(", ")}]`);

    if (!DRY_RUN) {
      const { error: updateErr } = await supabase
        .from("tenants")
        .update(updates)
        .eq("id", tenant.id);
      if (updateErr) {
        console.error(`  ✗ tenant ${tenant.id}: update failed —`, updateErr);
        continue;
      }
    }
    rotated++;
  }

  console.log(`\nDone. Rotated: ${rotated}, Skipped (already current): ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
