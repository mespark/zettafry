// Central place for site-wide constants used in SEO meta, JSON-LD and
// canonical URLs. Update SITE_URL here if the domain/subdomain ever changes
// — every route pulls from this single source instead of hardcoding it.

export const SITE_URL = "https://zettafry.mespark.in";
export const SITE_NAME = "Zettafry — Bills to Excel";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const AUTHOR_NAME = "Ravi Yadav";
export const AUTHOR_HANDLE = "Spark";
export const PORTFOLIO_URL = "https://mespark.in";
export const CONTACT_EMAIL = "contact@mespark.in";

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}
