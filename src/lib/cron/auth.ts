import { timingSafeEqual } from "node:crypto";

export function hasCronSecret() {
  return Boolean(process.env.CRON_SECRET);
}

export function isCronAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const received = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (!expected || !received) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
