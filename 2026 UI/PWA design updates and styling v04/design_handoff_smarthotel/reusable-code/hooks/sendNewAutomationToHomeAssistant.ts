import type { HAAutomation } from "../components/AutomationMapper";
import { TOKEN } from "../config";

export async function sendAutomationToHA(automation: HAAutomation): Promise<void> {
  const id = slugifyAlias(automation.alias);

  const response = await fetch(`/api/config/automation/config/${id}`, {
    method: "POST",
    headers: {
     Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
      ...automation,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save rule: ${response.status} ${errorText}`);
  }
}

// Turns "My Rule" into "my_rule"
function slugifyAlias(alias: string): string {
  return alias
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}
