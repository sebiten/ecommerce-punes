function getPhoneDigits(phone: string) {
  return phone.replace(/\D/g, "").replace(/^00/, "");
}

function getArgentinaNationalNumber(phone: string) {
  const digits = getPhoneDigits(phone);
  const withoutCountryCode = digits.startsWith("54")
    ? digits.slice(2)
    : digits;
  const withoutTrunkPrefix = withoutCountryCode.replace(/^0/, "");

  return withoutTrunkPrefix.startsWith("9") &&
    withoutTrunkPrefix.length === 11
    ? withoutTrunkPrefix.slice(1)
    : withoutTrunkPrefix;
}

export function isValidArgentinaContactPhone(phone: string) {
  return getArgentinaNationalNumber(phone).length === 10;
}

export function normalizeArgentinaWhatsAppPhone(phone: string) {
  if (!isValidArgentinaContactPhone(phone)) return "";

  return `549${getArgentinaNationalNumber(phone)}`;
}
