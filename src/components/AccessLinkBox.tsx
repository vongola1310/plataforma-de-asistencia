"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Muestra el link personal de acceso: clickeable para entrar y con botón de
 * copiar para compartirlo. Es la forma de entregar el link sin depender del
 * correo: el asistente lo guarda desde pantalla y el admin puede copiarlo para
 * enviarlo por el medio que quiera.
 */
export function AccessLinkBox({
  url,
  compact = false,
}: {
  url: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [clipboardFailed, setClipboardFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setClipboardFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles, mostramos el input para
      // seleccionar y copiar a mano.
      setCopied(false);
      setClipboardFailed(true);
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={url}
          className="break-all font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          {url}
        </a>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? "¡Copiado!" : "Copiar"}
        </Button>
      </div>
      {clipboardFailed ? (
        <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      ) : null}
    </div>
  );
}
