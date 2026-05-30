/* =============================================
   CONFIGURACIÓN DE AIRTABLE
   ─────────────────────────────────────────────
   1. Entra a https://airtable.com/create/tokens
   2. Crea un token con permiso "data.records:read"
      y "data.records:write" para tu base
   3. Pega el token y los IDs aquí
   ============================================= */

const AIRTABLE_CONFIG = {
  // Tu token de acceso personal (PAT)
  // Ejemplo: "patXXXXXXXXXXXXXX.xxxxxxxx..."
  token: "patu7UyqkIReA5N9o",

  // El ID de tu base de datos en Airtable
  // Lo encuentras en la URL: airtable.com/appXXXXXXXXXX/...
  baseId: "appyDoNimSlMmySYh",

  // El nombre exacto de tu tabla en Airtable
  tableName: "Lugares",
};

/*
  ─────────────────────────────────────────────
  ESTRUCTURA DE LA TABLA "Lugares" en Airtable
  ─────────────────────────────────────────────
  Crea estos campos exactamente con estos nombres:

  nombre          → Text (campo principal)
  categoria       → Single select
                    Opciones: Restaurante, Cafetería, Pueblo Mágico,
                              A Conocer, Paseo, Antojito, Naturaleza
  descripcion     → Long text
  link_maps       → URL
  link_red_social → URL
  visitado        → Checkbox
  prioridad       → Single select
                    Opciones: alta, media, baja
  fecha_agregado  → Date (se puede auto-rellenar con automations)

  ─────────────────────────────────────────────
  CÓMO PUBLICAR EN GITHUB PAGES
  ─────────────────────────────────────────────
  1. Sube esta carpeta a un repositorio de GitHub
  2. Ve a Settings → Pages
  3. En "Source" selecciona "Deploy from a branch"
  4. Rama: main, carpeta: / (root)
  5. ¡Listo! Tu sitio estará en:
     https://[usuario].github.io/[repo]/
  ─────────────────────────────────────────────
*/
