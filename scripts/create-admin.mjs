// Creates (or updates) the admin account. Run it yourself so the password never leaves your computer:
//   node --env-file=.env.local scripts/create-admin.mjs info@sibelmcginnis.com "Sibel McGinnis"
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline";

const [email, name = "Sibel McGinnis"] = process.argv.slice(2);
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/create-admin.mjs <email> [name]");
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      if (text.startsWith(question)) rl.output.write(question);
    };
    rl.question(question, (answer) => {
      rl.close();
      console.log();
      resolve(answer);
    });
  });
}

const password = await askHidden("New admin password (min 8 characters): ");
if (password.length < 8) {
  console.error("Password is too short.");
  process.exit(1);
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
const result = existing
  ? await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
  : await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
if (result.error) {
  console.error("Failed:", result.error.message);
  process.exit(1);
}
const id = result.data.user.id;
const { error } = await supabase
  .from("profiles")
  .upsert({ id, email, name, role: "admin", tier: "premium", status: "active" });
if (error) {
  console.error("Profile failed:", error.message);
  process.exit(1);
}
console.log(`Admin ready: ${email}`);
