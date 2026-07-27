import { ImageResponse } from "next/og";
import { GloriaIconArt } from "@/components/brand/gloria-icon-art";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 92,
        }}
      >
        <GloriaIconArt size={360} />
      </div>
    ),
    size
  );
}
