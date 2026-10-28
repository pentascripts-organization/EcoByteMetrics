import leaf from "@/shared/assets/brand/ecobyte-leaf-generated.webp";
import smallLeaf from "@/shared/assets/brand/ecobyte-leaf-small.webp";

export function HomeLeaf({ className = "", small = false }: { className?: string; small?: boolean }) {
  return <img className={className} src={small ? smallLeaf : leaf} width={small ? 96 : 1024} height={small ? 144 : 1536} alt="" aria-hidden="true" decoding="async" />;
}
