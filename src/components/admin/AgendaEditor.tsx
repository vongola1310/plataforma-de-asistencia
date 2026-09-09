"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AgendaItem = { hora: string; tema: string };

/**
 * Editor del temario. Es controlado: el estado vive en EventForm junto al resto
 * del formulario, para que un error de validación no se lleve por delante lo
 * que ya se había escrito.
 */
export function AgendaEditor({
  items,
  onChange,
}: {
  items: AgendaItem[];
  onChange: (items: AgendaItem[]) => void;
}) {
  const rows = items.length > 0 ? items : [{ hora: "", tema: "" }];

  function updateItem(index: number, field: keyof AgendaItem, value: string) {
    onChange(
      rows.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    onChange([...rows, { hora: "", tema: "" }]);
  }

  function removeItem(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  // Las filas en blanco no se guardan.
  const cleanItems = rows.filter((item) => item.hora || item.tema);

  return (
    <div className="space-y-3">
      <input type="hidden" name="agenda" value={JSON.stringify(cleanItems)} />
      {rows.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder="Hora (ej. 09:00)"
            aria-label={`Hora del punto ${index + 1}`}
            className="w-32"
            value={item.hora}
            onChange={(e) => updateItem(index, "hora", e.target.value)}
          />
          <Input
            placeholder="Tema"
            aria-label={`Tema del punto ${index + 1}`}
            value={item.tema}
            onChange={(e) => updateItem(index, "tema", e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeItem(index)}
          >
            Quitar
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        Agregar punto del temario
      </Button>
    </div>
  );
}
