export interface PluginDefinition {
  key: string;
  name: string;
  description: string;
  category: "crm" | "marketing" | "payments" | "analytics" | "integrations";
}

const registry: PluginDefinition[] = [
  {
    key: "crm_export",
    name: "CRM Export",
    description: "Exports leads and reservations to external CRMs.",
    category: "crm",
  },
  {
    key: "mortgage_calculator",
    name: "Mortgage Calculator",
    description: "Adds mortgage simulation widgets and endpoints.",
    category: "marketing",
  },
  {
    key: "webhook_connector",
    name: "Webhook Connector",
    description: "Pushes domain events to tenant-managed webhooks.",
    category: "integrations",
  },
];

export function listPlugins(): PluginDefinition[] {
  return registry;
}

export function hasPluginKey(pluginKey: string): boolean {
  return registry.some((p) => p.key === pluginKey);
}
