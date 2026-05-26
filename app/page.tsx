import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AuthenticatedApp } from "@/components/auth/AuthenticatedApp";

function getLegacyScriptSource() {
  return readFileSync(join(process.cwd(), "script.js"), "utf8");
}

export default function Home() {
  return <AuthenticatedApp scriptSource={getLegacyScriptSource()} />;
}
