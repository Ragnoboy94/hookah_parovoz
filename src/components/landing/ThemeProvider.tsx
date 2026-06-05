import type { SiteContent } from "@/lib/types";

interface ThemeProviderProps {
  content: SiteContent;
  children: React.ReactNode;
}

export function ThemeProvider({ content, children }: ThemeProviderProps) {
  const primaryGlow = `${content.theme.primaryColor}59`;

  return (
    <div
      style={
        {
          "--primary": content.theme.primaryColor,
          "--primary-glow": primaryGlow,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
