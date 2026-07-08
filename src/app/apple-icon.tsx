import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f6ae66",
          color: "#fffdf9",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <span
          style={{
            fontSize: 43,
            fontWeight: 900,
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          Punes
        </span>
      </div>
    ),
    size
  );
}
