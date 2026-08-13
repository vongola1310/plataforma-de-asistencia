import Image from "next/image";
import logo from "../../public/logo-euroimmun.jpg";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src={logo}
      alt="Euroimmun · From Revvity"
      className={className}
      priority
    />
  );
}
