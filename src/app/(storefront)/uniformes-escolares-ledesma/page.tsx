import { permanentRedirect } from "next/navigation";

export default function SchoolUniformsLedesmaPage() {
  permanentRedirect("/products?category=uniformes-escolares");
}
