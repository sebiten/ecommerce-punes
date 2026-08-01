import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { GloriaWordmark } from "@/components/brand/gloria-wordmark";
import { FACEBOOK_PROMOTION } from "@/lib/promotions";
import { getFacebookPromotionAvailability } from "@/lib/promotions-server";

export const alt =
  "Uniformes escolares y ofertas de Pilchería Gloria en Ledesma, Jujuy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

async function getUniformImageData(filename: string) {
  const image = await readFile(
    join(process.cwd(), "public", "images", "uniforms", "catalog", filename)
  );

  return `data:image/jpeg;base64,${image.toString("base64")}`;
}

export default async function OpenGraphImage() {
  const [normalShirt, normalPolo, promotion] = await Promise.all([
    getUniformImageData("normal-remera-og.jpg"),
    getUniformImageData("normal-chomba-og.jpg"),
    getFacebookPromotionAvailability(),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#15170f",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          right: -170,
          top: -210,
          borderRadius: 999,
          background: "#a8d829",
          opacity: 0.22,
        }}
      />

      <div
        style={{
          width: 690,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "54px 38px 48px 62px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", color: "white" }}>
            <GloriaWordmark width={224} height={72} title="Pilchería Gloria" />
          </div>
          <div
            style={{
              display: "flex",
              borderRadius: 999,
              background: "#a8d829",
              color: "#17210f",
              padding: "10px 16px",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            {promotion.available
              ? "10 PRIMERAS COMPRAS"
              : "STOCK REAL POR TALLE"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 48,
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#badd63",
              fontSize: 25,
              fontWeight: 800,
              letterSpacing: 1.5,
            }}
          >
            UNIFORMES ESCOLARES EN LEDESMA
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontSize: 68,
              lineHeight: 0.94,
              fontWeight: 900,
              letterSpacing: -3,
            }}
          >
            {promotion.available ? "$3.000 de descuento" : "Uniformes escolares"}
          </div>
          {promotion.available ? (
            <div
              style={{
                display: "flex",
                marginTop: 25,
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: "13px 20px",
                  border: "2px solid #a8d829",
                  borderRadius: 14,
                  color: "#d8f47f",
                  fontSize: 25,
                  fontWeight: 900,
                  letterSpacing: 2,
                }}
              >
                {FACEBOOK_PROMOTION.code}
              </div>
              <div style={{ display: "flex", color: "#c8cfbd", fontSize: 21 }}>
                Se carga desde el enlace
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                marginTop: 25,
                color: "#c8cfbd",
                fontSize: 25,
              }}
            >
              Buscá tu escuela y elegí entre los talles disponibles
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            color: "#c8cfbd",
            fontSize: 21,
          }}
        >
          Comprá online · Retiro en Av. Los Ceibos 429
        </div>
      </div>

      <div
        style={{
          width: 510,
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "68px 36px 52px 8px",
          position: "relative",
        }}
      >
        {[
          { src: normalShirt, label: "Remera" },
          { src: normalPolo, label: "Chomba" },
        ].map((product, index) => (
          <div
            key={product.label}
            style={{
              width: 218,
              height: 462,
              display: "flex",
              position: "relative",
              overflow: "hidden",
              borderRadius: 28,
              border: "3px solid rgba(255,255,255,0.16)",
              transform: index === 0 ? "rotate(-2deg)" : "rotate(2deg)",
              background: "#29292c",
            }}
          >
            <img
              src={product.src}
              alt=""
              width={218}
              height={462}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                bottom: 12,
                display: "flex",
                flexDirection: "column",
                borderRadius: 16,
                background: "rgba(21,23,15,0.92)",
                padding: "11px 13px",
              }}
            >
              <div style={{ display: "flex", color: "#d8f47f", fontSize: 16 }}>
                Escuela Normal · {product.label}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginTop: 3,
                }}
              >
                <span style={{ fontSize: 25, fontWeight: 900 }}>$20.000</span>
                <span
                  style={{
                    color: "#aeb5a5",
                    fontSize: 14,
                    textDecoration: "line-through",
                  }}
                >
                  $25.000
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>,
    size
  );
}
