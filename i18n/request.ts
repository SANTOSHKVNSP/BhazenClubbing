import { getRequestConfig } from "next-intl/server";

// English-only for now, but i18n-ready (ADR-012): to add a language, drop a new
// messages/<locale>.json and resolve `locale` from the request/cookie/route here.
export default getRequestConfig(async () => {
  const locale = "en";
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
