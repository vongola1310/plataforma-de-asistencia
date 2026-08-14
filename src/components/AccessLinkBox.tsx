"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Muestra el link personal de acceso con botón de copiar. Es la forma de
 * entregar el link sin depender del correo: el asistente lo guarda desde
 * pantalla y el admin puede copiarlo para enviarlo por el medio que quiera.
 */
export function AccessLinkBox({
  url,
  compact = false,
}: {
  url: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles, el input sigue visible para
      // seleccionar y copiar a mano.
      setCopied(false);
    }
  }

  if (compact) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={copy}>
        {copied ? "¡Copiado!" : "Copiar link"}
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      <Button type="button" variant="outline" onClick={copy}>
        {copied ? "¡Copiado!" : "Copiar"}
      </Button>
    </div>
  );
}
