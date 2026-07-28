import type { StoreSettings } from "@/types";

const PLACEHOLDER_PATTERN =
  /completar|confirmar|ejemplo\.com|industrial 1234/i;

export function getStoreReadinessIssues(settings: StoreSettings) {
  const issues: string[] = [];

  if (!settings.contact_email || PLACEHOLDER_PATTERN.test(settings.contact_email)) {
    issues.push("email de contacto");
  }
  if (!settings.contact_phone || PLACEHOLDER_PATTERN.test(settings.contact_phone)) {
    issues.push("teléfono");
  }
  if (!settings.address_line || PLACEHOLDER_PATTERN.test(settings.address_line)) {
    issues.push("dirección");
  }
  if (!settings.business_hours || PLACEHOLDER_PATTERN.test(settings.business_hours)) {
    issues.push("horarios");
  }
  if (!settings.legal_name?.trim()) {
    issues.push("razón social");
  }
  if (!settings.tax_id?.trim()) {
    issues.push("CUIT");
  }
  if (!settings.legal_address?.trim()) {
    issues.push("domicilio legal");
  }

  return issues;
}

export function isStoreReadyForCheckout(settings: StoreSettings) {
  return getStoreReadinessIssues(settings).length === 0;
}
