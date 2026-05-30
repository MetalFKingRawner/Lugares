/* =============================================
   NUESTROS LUGARES — app.js
   Victor & Daniela
   ============================================= */

// ── Año en el footer ──
document.getElementById("anio").textContent = new Date().getFullYear();

// ── Estado global ──
let todosLosLugares = [];
let filtroActual    = "todos";
let busquedaActual  = "";
let ordenActual     = "prioridad";

// ── Prioridad → valor numérico ──
const PRIORIDAD_ORDEN = { alta: 0, media: 1, baja: 2, "": 3 };

// ── Elementos del DOM ──
const gridEl       = document.getElementById("grid-lugares");
const cargaEl      = document.getElementById("estado-carga");
const vacioEl      = document.getElementById("estado-vacio");
const buscadorEl   = document.getElementById("buscador");
const ordenEl      = document.getElementById("orden");
const filterBtns   = document.querySelectorAll(".filter-btn");

const statTotal     = document.getElementById("stat-total");
const statVisitados = document.getElementById("stat-visitados");
const statPendientes= document.getElementById("stat-pendientes");

/* ══════════════════════════════════════════════
   1. CARGA DESDE AIRTABLE
══════════════════════════════════════════════ */
async function cargarLugares() {
  // Si no está configurado, muestra datos de ejemplo
  if (!AIRTABLE_CONFIG.token || AIRTABLE_CONFIG.token === "TU_TOKEN_AQUI") {
    mostrarDatosEjemplo();
    return;
  }

  try {
    mostrarCarga(true);

    const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(AIRTABLE_CONFIG.tableName)}?view=Grid%20view`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_CONFIG.token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Error Airtable: ${res.status}`);
    }

    const data = await res.json();
    todosLosLugares = data.records.map(mapearRegistro);
    renderizarVista();
  } catch (err) {
    console.error("Error cargando lugares:", err);
    mostrarDatosEjemplo();
  }
}

// Transforma un registro de Airtable a nuestro formato interno
function mapearRegistro(record) {
  const f = record.fields;
  return {
    id:             record.id,
    nombre:         f.nombre         || "Sin nombre",
    categoria:      f.categoria       || "",
    descripcion:    f.descripcion     || "",
    link_maps:      f.link_maps       || "",
    link_red_social:f.link_red_social || "",
    visitado:       f.visitado        || false,
    prioridad:      (f.prioridad || "").toLowerCase(),
    fecha_agregado: f.fecha_agregado  || "",
  };
}

/* ══════════════════════════════════════════════
   2. DATOS DE EJEMPLO (cuando no hay token)
══════════════════════════════════════════════ */
function mostrarDatosEjemplo() {
  todosLosLugares = [
    {
      id: "demo-1",
      nombre: "El Rincón del Sabor",
      categoria: "Restaurante",
      descripcion: "Un lugar acogedor que vimos en Instagram con unos tacos de cochinita pibil que se ven increíbles. Dicen que la salsa verde es de otro mundo.",
      link_maps: "https://maps.google.com",
      link_red_social: "https://instagram.com",
      visitado: false,
      prioridad: "alta",
      fecha_agregado: "2025-01-15",
    },
    {
      id: "demo-2",
      nombre: "Café de la Luz",
      categoria: "Cafetería",
      descripcion: "Cafetería pequeña con terraza al aire libre. Tienen croissants artesanales y un cold brew que nos recomendaron.",
      link_maps: "https://maps.google.com",
      link_red_social: "",
      visitado: true,
      prioridad: "media",
      fecha_agregado: "2025-01-10",
    },
    {
      id: "demo-3",
      nombre: "Tepoztlán",
      categoria: "Pueblo Mágico",
      descripcion: "El pueblo con la energía más especial de la región. Queremos subir al cerro y comer tlayudas en el mercado.",
      link_maps: "https://maps.google.com",
      link_red_social: "https://tiktok.com",
      visitado: false,
      prioridad: "alta",
      fecha_agregado: "2025-01-20",
    },
    {
      id: "demo-4",
      nombre: "Parque Nacional Lagunas de Zempoala",
      categoria: "Naturaleza",
      descripcion: "Lagos rodeados de bosque de pinos a solo hora y media de la ciudad. Ideal para un picnic o caminata tranquila.",
      link_maps: "https://maps.google.com",
      link_red_social: "",
      visitado: false,
      prioridad: "media",
      fecha_agregado: "2025-02-05",
    },
    {
      id: "demo-5",
      nombre: "Tlayudas El Nico",
      categoria: "Antojito",
      descripcion: "El puesto de tlayudas más famoso del barrio, solo abre jueves y viernes noche. Hay que llegar temprano porque se acaba.",
      link_maps: "https://maps.google.com",
      link_red_social: "https://instagram.com",
      visitado: false,
      prioridad: "alta",
      fecha_agregado: "2025-02-12",
    },
    {
      id: "demo-6",
      nombre: "Jardín Borda",
      categoria: "Paseo",
      descripcion: "Jardín histórico en Cuernavaca con arquitectura colonial preciosa. Perfecto para una tarde de domingo tranquila.",
      link_maps: "https://maps.google.com",
      link_red_social: "",
      visitado: true,
      prioridad: "baja",
      fecha_agregado: "2025-01-08",
    },
  ];
  renderizarVista();
}

/* ══════════════════════════════════════════════
   3. ACTUALIZAR VISITADO EN AIRTABLE
══════════════════════════════════════════════ */
async function toggleVisitadoAirtable(id, nuevoValor) {
  if (!AIRTABLE_CONFIG.token || AIRTABLE_CONFIG.token === "TU_TOKEN_AQUI") return;

  try {
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(AIRTABLE_CONFIG.tableName)}/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_CONFIG.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: { visitado: nuevoValor } }),
      }
    );
  } catch (err) {
    console.error("Error actualizando visitado:", err);
  }
}

/* ══════════════════════════════════════════════
   4. FILTRADO + ORDENADO
══════════════════════════════════════════════ */
function filtrarYOrdenar() {
  let lista = [...todosLosLugares];

  // Filtro por categoría
  if (filtroActual !== "todos") {
    lista = lista.filter((l) => l.categoria === filtroActual);
  }

  // Búsqueda por nombre o descripción
  if (busquedaActual) {
    const q = busquedaActual.toLowerCase();
    lista = lista.filter(
      (l) =>
        l.nombre.toLowerCase().includes(q) ||
        l.descripcion.toLowerCase().includes(q) ||
        l.categoria.toLowerCase().includes(q)
    );
  }

  // Ordenar
  lista.sort((a, b) => {
    switch (ordenActual) {
      case "prioridad":
        // No visitados primero, luego por prioridad
        if (a.visitado !== b.visitado) return a.visitado ? 1 : -1;
        return (PRIORIDAD_ORDEN[a.prioridad] ?? 3) - (PRIORIDAD_ORDEN[b.prioridad] ?? 3);
      case "nombre":
        return a.nombre.localeCompare(b.nombre, "es");
      case "reciente":
        return new Date(b.fecha_agregado || 0) - new Date(a.fecha_agregado || 0);
      case "visitados":
        return (b.visitado ? 1 : 0) - (a.visitado ? 1 : 0);
      default:
        return 0;
    }
  });

  return lista;
}

/* ══════════════════════════════════════════════
   5. RENDER
══════════════════════════════════════════════ */
function renderizarVista() {
  mostrarCarga(false);

  const lista = filtrarYOrdenar();

  // Actualizar estadísticas (siempre sobre total, no filtrado)
  const total     = todosLosLugares.length;
  const visitados = todosLosLugares.filter((l) => l.visitado).length;
  statTotal.textContent     = total;
  statVisitados.textContent = visitados;
  statPendientes.textContent= total - visitados;

  // Grid
  gridEl.innerHTML = "";

  if (lista.length === 0) {
    vacioEl.classList.remove("hidden");
    return;
  }

  vacioEl.classList.add("hidden");

  lista.forEach((lugar, i) => {
    const card = crearTarjeta(lugar);
    // Escalonar la animación
    card.style.animationDelay = `${i * 0.05}s`;
    gridEl.appendChild(card);
  });
}

/* ──────────────────────────────────────
   Crear tarjeta desde template
─────────────────────────────────────── */
function crearTarjeta(lugar) {
  const tpl   = document.getElementById("tpl-tarjeta");
  const clone = tpl.content.cloneNode(true);
  const card  = clone.querySelector(".card");

  // Accesibilidad
  card.setAttribute("aria-label", lugar.nombre);

  // Visitada
  if (lugar.visitado) card.classList.add("visitada");

  // Badge categoría
  const badge = card.querySelector(".card__cat-badge");
  badge.textContent = lugar.categoria;
  badge.dataset.cat = lugar.categoria;

  // Prioridad
  const prio = card.querySelector(".card__priority");
  prio.dataset.p = lugar.prioridad;

  // Nombre
  card.querySelector(".card__nombre").textContent = lugar.nombre;

  // Descripción
  const descEl = card.querySelector(".card__desc");
  if (lugar.descripcion) {
    descEl.textContent = lugar.descripcion;
  } else {
    descEl.style.display = "none";
  }

  // Botón Maps
  const mapsBtn = card.querySelector(".card__btn--maps");
  if (lugar.link_maps) {
    mapsBtn.href = lugar.link_maps;
  } else {
    mapsBtn.classList.add("hidden");
  }

  // Botón Red social
  const socialBtn = card.querySelector(".card__btn--social");
  if (lugar.link_red_social) {
    socialBtn.href = lugar.link_red_social;
  } else {
    socialBtn.classList.add("hidden");
  }

  // Botón Visitado
  const checkBtn = card.querySelector(".card__btn--check");
  actualizarBtnCheck(checkBtn, lugar.visitado);

  checkBtn.addEventListener("click", async () => {
    lugar.visitado = !lugar.visitado;
    actualizarBtnCheck(checkBtn, lugar.visitado);
    card.classList.toggle("visitada", lugar.visitado);

    // Actualizar estadísticas
    const v = todosLosLugares.filter((l) => l.visitado).length;
    statVisitados.textContent = v;
    statPendientes.textContent = todosLosLugares.length - v;

    // Sync a Airtable en segundo plano
    await toggleVisitadoAirtable(lugar.id, lugar.visitado);
  });

  // Fecha
  const fechaEl = card.querySelector(".card__fecha");
  if (lugar.fecha_agregado) {
    const d = new Date(lugar.fecha_agregado + "T12:00:00");
    fechaEl.textContent = "Guardado " + d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  } else {
    fechaEl.parentElement.style.display = "none";
  }

  return card;
}

function actualizarBtnCheck(btn, visitado) {
  const label = btn.querySelector(".check-label");
  if (visitado) {
    label.textContent = "Visitado ✓";
    btn.setAttribute("aria-label", "Marcar como no visitado");
  } else {
    label.textContent = "Visitado";
    btn.setAttribute("aria-label", "Marcar como visitado");
  }
}

/* ══════════════════════════════════════════════
   6. EVENTOS DE INTERACCIÓN
══════════════════════════════════════════════ */

// Buscador — debounce para no filtrar en cada tecla
let debounceTimer;
buscadorEl.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    busquedaActual = buscadorEl.value.trim();
    renderizarVista();
  }, 250);
});

// Filtros de categoría
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filtroActual = btn.dataset.cat;
    renderizarVista();
  });
});

// Selector de orden
ordenEl.addEventListener("change", () => {
  ordenActual = ordenEl.value;
  renderizarVista();
});

/* ══════════════════════════════════════════════
   7. UTILIDADES
══════════════════════════════════════════════ */
function mostrarCarga(visible) {
  cargaEl.classList.toggle("hidden", !visible);
  gridEl.classList.toggle("hidden", visible);
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
cargarLugares();
