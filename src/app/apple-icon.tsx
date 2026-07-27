import { ImageResponse } from "next/og";
import { GloriaIconArt } from "@/components/brand/gloria-icon-art";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "#a8d829",
          borderRadius: 36,
        }}
      >
        <GloriaIconArt size={126} />
      </div>
    ),
    size
  );
}
