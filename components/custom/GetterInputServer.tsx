import { siteConfig } from "@/lib/site-config";
import { GetterInput } from "./GetterInput";

export function GetterInputServer() {
  const disabledMessages = {
    youtube: siteConfig.youtubeDisabledMessage
      ? {
          text: siteConfig.youtubeDisabledMessage,
          href: siteConfig.youtubeDisabledHref || undefined,
        }
      : undefined,
    tiktok: siteConfig.tiktokDisabledMessage
      ? { text: siteConfig.tiktokDisabledMessage, href: siteConfig.tiktokDisabledHref || undefined }
      : undefined,
    twitch: siteConfig.twitchDisabledMessage
      ? { text: siteConfig.twitchDisabledMessage, href: siteConfig.twitchDisabledHref || undefined }
      : undefined,
  };

  return <GetterInput disabledMessages={disabledMessages} />;
}
