import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + "/../.env" });
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Find pending reservations
  const { data: reservations } = await supabase
    .from("reservations")
    .select("unit_id")
    .eq("status", "pending");

  if (reservations && reservations.length > 0) {
    const unitIds = reservations.map((r) => r.unit_id);
    const { error } = await supabase
      .from("units")
      .update({ status: "reserved" })
      .in("id", unitIds);
    if (!error) {
      console.log(`Fixed ${unitIds.length} orphaned units.`);
    } else {
      console.error(error);
    }
  } else {
    console.log("No pending reservations found.");
  }
}
run();
