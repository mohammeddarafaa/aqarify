import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + "/../.env" });
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function aes256cbcEncrypt(plaintext: string, key: string): string {
  const normKey = Buffer.from(key.slice(0, 32).padEnd(32, "0"));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", normKey, iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${body.toString("hex")}`;
}

async function run() {
  const encKey = process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEYS?.split(",")[0].split(":")[1] || "default123";
  // Encrypt a test API key
  const encryptedKey = "v1:" + aes256cbcEncrypt("test_sk_fake_key_1234567890", encKey);
  const encryptedHmac = "v1:" + aes256cbcEncrypt("test_hmac_secret_1234567890", encKey);

  const { data, error } = await supabase
    .from("tenants")
    .update({
      paymob_integration_id: "123456",
      paymob_iframe_id: "123456",
      paymob_api_key_enc: encryptedKey,
      paymob_hmac_secret_enc: encryptedHmac,
      payment_gateway: "paymob",
    })
    .eq("slug", "labore");

  if (error) {
    console.error("Failed", error);
  } else {
    console.log("Successfully seeded Paymob config for 'labore' tenant!");
  }
}
run();
