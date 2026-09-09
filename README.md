# Plataforma de asistencia — Showroom Euroimmun

Plataforma de registro y seguimiento para las capacitaciones del showroom:
publicación de eventos, registro público de asistentes con control de cupo y
lista de espera, correos automáticos, pase de lista, constancias y encuesta de
satisfacción.

## Cómo funciona

### Para el asistente (público, sin cuenta)

1. Entra a `/`, ve las sesiones publicadas y abre la que le interesa.
2. Se registra en `/eventos/[id]/registro` con sus datos (nombre, correo,
   teléfono, grado académico e institución).
3. Si hay lugar queda **registrado**; si el cupo está lleno queda en **lista de
   espera**.
4. Se le genera un **link personal** (`/mi-registro/[token]`) con un token de 32
   caracteres. Ese link es su única llave: desde ahí consulta el temario y el
   croquis, ve los datos de conexión de Webex, confirma su asistencia, da de
   baja su lugar si ya no puede venir, descarga su constancia y responde la
   encuesta una vez terminado el evento.

El link se muestra en pantalla al terminar el registro **y** se envía por
correo. Un correo ya registrado nunca redirige a la página de ese registro: el
link se reenvía por correo al dueño de la dirección.

### Para el administrador (`/admin`, con contraseña)

- **Eventos**: alta y edición, temario, cupo, estado (borrador / publicado /
  cancelado / completado) y datos de conexión de Webex.
- **Registros**: lista por evento o global con filtros; dar lugar a quien está
  en lista de espera, pasar lista, dar de baja y copiar el link de acceso de
  cualquier asistente.
- **Croquis**: sube la imagen de las instalaciones (Vercel Blob), visible en las
  páginas públicas.
- **Correos**: bitácora de todo lo enviado, con el detalle del error y botón de
  reenvío para los que fallaron.
- **Constancias**: se carga la URL de la constancia por asistente, o se envían
  en lote las pendientes de un evento.

### Automático

Un cron diario (`vercel.json` → `/api/cron/recordatorios`, 14:00 UTC = 8:00 en
CDMX) envía el recordatorio a quienes tienen lugar en un evento que ocurre al
día siguiente.

## Stack

Next.js 16 (App Router) · React 19 · Prisma 7 sobre Postgres (Neon) ·
Auth.js v5 · Resend · Vercel Blob · Tailwind 4 con componentes shadcn/ui.

## Puesta en marcha

```bash
npm install
cp .env.example .env     # y llena los valores
npx prisma migrate deploy
npx prisma db seed       # crea el administrador inicial
npm run dev
```

Cada variable está documentada en `.env.example`. Solo `DATABASE_URL`,
`DIRECT_URL` y `AUTH_SECRET` son obligatorias para arrancar: sin
`RESEND_API_KEY` la app funciona igual pero no envía correos, y el asistente
recibe su link únicamente en pantalla.

### Sobre `APP_URL`

Es el dominio con el que se arman los links personales que van en los correos.
**No la renombres a `NEXT_PUBLIC_APP_URL`**: Next sustituye las variables con
prefijo `NEXT_PUBLIC_` por su texto durante `next build`, así que el valor
quedaría congelado en el bundle y los links apuntarían a `localhost` hasta el
siguiente deploy. Si la dejas vacía, la app usa el host del propio request, que
es lo correcto en desarrollo.

## Modelo de datos

`Event` → `Registration` (1:N) → `SurveyResponse` (1:1), más `EmailLog` para la
bitácora de correos, `Admin` para el panel y `SiteSettings` para el croquis.

Un registro pasa por estos estados:

| Estado      | Ocupa cupo | Cómo se llega |
| ----------- | :--------: | ------------- |
| `REGISTERED`| sí         | registro con lugar disponible |
| `CONFIRMED` | sí         | el asistente confirma desde su link |
| `ATTENDED`  | sí         | el admin pasa lista |
| `WAITLIST`  | no         | registro con el cupo lleno |
| `CANCELLED` | no         | baja del asistente o del admin |

El cupo se calcula contando los estados que ocupan lugar
(`src/lib/capacity.ts`), y el registro concurrente se serializa con un
`SELECT ... FOR UPDATE` sobre la fila del evento para que dos personas no tomen
el mismo último lugar.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | servidor de desarrollo |
| `npm run build` | `prisma generate` + build de producción |
| `npm run lint` | ESLint |
| `npx prisma migrate deploy` | aplica las migraciones pendientes |
| `npx prisma db seed` | crea o actualiza el administrador inicial |
