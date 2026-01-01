export const AUTH_COOKIE = "psi-site-auth";

export function isAuthedFromCookie(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return false;
  // bem simples e suficiente pro MVP
  return cookieHeader.split(";").some((c) => c.trim() === `${AUTH_COOKIE}=1`);
}
