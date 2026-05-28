import { siteConfig } from "@/lib/site-config";

export function NewsBanner() {
  if (!siteConfig.bannerText) return null;

  const inner = (
    <span className="text-sm font-semibold text-stroy-900">{siteConfig.bannerText}</span>
  );

  return (
    <div className="w-full bg-stroy-300 px-4 py-2 text-center">
      {siteConfig.bannerHref ? (
        <a
          href={siteConfig.bannerHref}
          className="inline-flex items-center gap-1 hover:underline underline-offset-2"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}
