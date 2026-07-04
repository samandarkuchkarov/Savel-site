import { ImageResponse } from "next/og";

// iOS home-screen icon — full-bleed coral (iOS applies its own rounding).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const HEART =
  "M12 20.5l-1.4-1.3C5.4 14.3 2 11.2 2 7.4 2 4.4 4.4 2 7.4 2c1.7 0 3.3.8 4.6 2.1C13.3 2.8 14.9 2 16.6 2 19.6 2 22 4.4 22 7.4c0 3.8-3.4 6.9-8.6 11.8L12 20.5z";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FD4F61",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 24 24" fill="#fff">
          <path d={HEART} />
        </svg>
      </div>
    ),
    { ...size },
  );
}
