export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Returns the login page URL. No more Manus OAuth dependency.
export const getLoginUrl = (returnPath?: string): string => {
  if (returnPath) {
    return `/login?return=${encodeURIComponent(returnPath)}`;
  }
  return "/login";
};
