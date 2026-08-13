"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AgendaItem = { hora: string; tema: string };

export function AgendaEditor({ initialItems }: { initialItems: AgendaItem[] }) {
  const [items, setItems] = useState<AgendaItem[]>(
    initialItems.length > 0 ? initialItems : [{ hora: "", tema: "" }]
  );

  function updateItem(index: number, field: keyof AgendaItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { hora: "", tema: "" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const cleanItems = items.filter((item) => item.hora || item.tema);

  return (
    <div className="space-y-3">
      <input type="hidden" name="agenda" value={JSON.stringify(cleanItems)} />
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder="Hora (ej. 09:00)"
            className="w-32"
            value={item.hora}
            onChange={(e) => updateItem(index, "hora", e.target.value)}
          />
          <Input
            placeholder="Tema"
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
