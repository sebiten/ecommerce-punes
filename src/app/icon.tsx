import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
        <div
          style={{
            alignItems: "center",
            border: "10px solid rgba(255, 253, 249, 0.62)",
            borderRadius: 112,
            display: "flex",
            height: 396,
            justifyContent: "center",
            width: 396,
          }}
        >
          <span
            style={{
              fontSize: 118,
              fontWeight: 900,
              letterSpacing: -10,
              lineHeight: 1,
            }}
          >
            Punes
          </span>
        </div>
      </div>
    ),
    size
  );
}
