import type { ReactNode } from "react";

export function EmailLayout({
  previewText,
  children,
}: {
  previewText: string;
  children: ReactNode;
}) {
  return (
    <html lang="es">
      {/* eslint-disable-next-line @next/next/no-head-element -- plantilla de email renderizada fuera del árbol de páginas de Next */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{previewText}</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: "24px 0",
          backgroundColor: "#f4f4f5",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ maxWidth: 560, margin: "0 auto" }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 8,
                  padding: 32,
                  border: "1px solid #e4e4e7",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    color: "#71717a",
                    margin: "0 0 24px",
                  }}
                >
                  Showroom · Capacitaciones
                </p>
                {children}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "16px 8px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "#a1a1aa", margin: 0 }}>
                  Este correo fue enviado automáticamente, por favor no
                  respondas a esta dirección.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export const emailStyles = {
  heading: {
    fontSize: 20,
    fontWeight: 700,
    color: "#18181b",
    margin: "0 0 16px",
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#3f3f46",
    margin: "0 0 12px",
  },
  label: {
    fontSize: 13,
    color: "#71717a",
    margin: "0 0 4px",
  },
  link: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#166534",
    wordBreak: "break-all",
    margin: "0 0 12px",
    display: "inline-block",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#18181b",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    padding: "10px 20px",
    borderRadius: 6,
    marginTop: 8,
  },
} as const;
