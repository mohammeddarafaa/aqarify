import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + "/../.env" });
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: user } = await supabase.from("users").select("id").eq("full_name", "Anastasia Mercer").single();
  if (!user) return;

  const { data: reservations } = await supabase
    .from("reservations")
    .select("id")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (reservations && reservations.length > 1) {
    // Keep the first (most recent) one, delete the rest
    const toDelete = reservations.slice(1).map(r => r.id);
    await supabase.from("reservations").delete().in("id", toDelete);
    console.log("Deleted duplicate reservations.");
  }
  
  // They shouldn't be on the waitlist for a unit they reserved
  await supabase.from("waiting_list").delete().eq("customer_id", user.id);
  console.log("Cleaned up invalid waitlist entry.");
}
run();
