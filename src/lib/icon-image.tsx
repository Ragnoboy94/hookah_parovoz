import { ImageResponse } from "next/og";

interface IconImageProps {
  letter: string;
  color: string;
  size: number;
  fontSize: number;
  radius: number;
}

export function renderIconImage({
  letter,
  color,
  size,
  fontSize,
  radius,
}: IconImageProps) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: color,
          color: "white",
          fontSize,
          fontWeight: 700,
          borderRadius: radius,
        }}
      >
        {letter}
      </div>
    ),
    { width: size, height: size },
  );
}
