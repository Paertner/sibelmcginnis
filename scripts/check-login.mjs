// Tells you why a sign-in fails. Uses the same keys as the site, and asks for the password privately.
//   node --env-file=.env.local scripts/check-login.mjs info@sibelmcginnis.com
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/check-login.mjs <email>");
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
const password = await askHidden("Password: ");
console.log(`(${password.length} characters typed, ${password !== password.trim() ? "has spaces at the ends" : "no spaces at the ends"})`);
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const { data, error } = await anon.auth.signInWithPassword({ email, password });
if (error) console.log("FAILED:", error.status, error.code ?? "", "-", error.message);
else console.log("OK: these keys and this password work. The site on Hostinger should accept them too.");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data: profile } = await admin.from("profiles").select("role,status").eq("email", email).maybeSingle();
console.log("profile:", profile ?? "none");
void data;
