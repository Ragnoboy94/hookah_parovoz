import { getContent } from "@/lib/content";
import { renderIconImage } from "@/lib/icon-image";

export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const site = await getContent();

  return renderIconImage({
    letter: site.title.charAt(0).toUpperCase(),
    color: site.theme.primaryColor,
    size: 180,
    fontSize: 96,
    radius: 36,
  });
}
