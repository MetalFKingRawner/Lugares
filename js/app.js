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
   8. MODAL — AÑADIR NUEVO LUGAR
══════════════════════════════════════════════ */
const overlay      = document.getElementById("modal-overlay");
const btnAbrir     = document.getElementById("btn-abrir-modal");
const btnCerrar    = document.getElementById("btn-cerrar-modal");
const btnCancelar  = document.getElementById("btn-cancelar");
const btnGuardar   = document.getElementById("btn-guardar");
const toastEl      = document.getElementById("toast");

// Campos
const fNombre      = document.getElementById("f-nombre");
const fCategoria   = document.getElementById("f-categoria");
const fDescripcion = document.getElementById("f-descripcion");
const fMaps        = document.getElementById("f-maps");
const fSocial      = document.getElementById("f-social");
const countDesc    = document.getElementById("count-desc");

// ── Abrir / cerrar modal ──────────────────────
function abrirModal() {
  limpiarFormulario();
  overlay.classList.remove("hidden");
  // Pequeño delay para que la animación funcione al quitar hidden
  requestAnimationFrame(() => {
    overlay.classList.add("abriendo");
    overlay.classList.remove("cerrando");
  });
  fNombre.focus();
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  overlay.classList.add("cerrando");
  overlay.classList.remove("abriendo");
  setTimeout(() => {
    overlay.classList.add("hidden");
    overlay.classList.remove("cerrando");
    document.body.style.overflow = "";
  }, 260);
}

btnAbrir.addEventListener("click", abrirModal);
btnCerrar.addEventListener("click", cerrarModal);
btnCancelar.addEventListener("click", cerrarModal);

// Cerrar al hacer click fuera
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) cerrarModal();
});

// Cerrar con Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !overlay.classList.contains("hidden")) cerrarModal();
});

// ── Contador de caracteres ────────────────────
fDescripcion.addEventListener("input", () => {
  countDesc.textContent = fDescripcion.value.length;
});

// ── Validación ────────────────────────────────
function esUrlValida(str) {
  if (!str) return true; // opcional
  try { return ["http:", "https:"].includes(new URL(str).protocol); }
  catch { return false; }
}

function mostrarError(inputEl, errorId, visible) {
  const errEl = document.getElementById(errorId);
  if (visible) {
    inputEl.classList.add("error");
    errEl.classList.remove("hidden");
  } else {
    inputEl.classList.remove("error");
    errEl.classList.add("hidden");
  }
}

function validarFormulario() {
  let ok = true;

  // Nombre obligatorio
  const nombreVacio = !fNombre.value.trim();
  mostrarError(fNombre, "err-nombre", nombreVacio);
  if (nombreVacio) ok = false;

  // Categoría obligatoria
  const catVacia = !fCategoria.value;
  mostrarError(fCategoria, "err-categoria", catVacia);
  if (catVacia) ok = false;

  // URLs opcionales pero deben ser válidas si se llenan
  const mapsInvalido = !esUrlValida(fMaps.value.trim());
  mostrarError(fMaps, "err-maps", mapsInvalido);
  if (mapsInvalido) ok = false;

  const socialInvalido = !esUrlValida(fSocial.value.trim());
  mostrarError(fSocial, "err-social", socialInvalido);
  if (socialInvalido) ok = false;

  return ok;
}

// Limpiar errores al escribir
[fNombre, fCategoria, fMaps, fSocial].forEach((el) => {
  el.addEventListener("input", () => el.classList.remove("error"));
});

// ── Limpiar formulario ────────────────────────
function limpiarFormulario() {
  fNombre.value      = "";
  fCategoria.value   = "";
  fDescripcion.value = "";
  fMaps.value        = "";
  fSocial.value      = "";
  countDesc.textContent = "0";

  // Resetear prioridad a "media"
  const radioMedia = document.querySelector('input[name="prioridad"][value="media"]');
  if (radioMedia) radioMedia.checked = true;

  // Limpiar errores
  ["f-nombre","f-categoria","f-maps","f-social"].forEach((id) => {
    document.getElementById(id).classList.remove("error");
  });
  ["err-nombre","err-categoria","err-maps","err-social"].forEach((id) => {
    document.getElementById(id).classList.add("hidden");
  });
}

// ── Toast ─────────────────────────────────────
let toastTimer;
function mostrarToast(mensaje, tipo = "ok") {
  clearTimeout(toastTimer);
  toastEl.textContent = tipo === "ok" ? "✓ " + mensaje : "✕ " + mensaje;
  toastEl.className   = `toast toast--${tipo}`;
  toastTimer = setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 3500);
}

// ── Estado del botón guardar ──────────────────
function setBtnGuardando(cargando) {
  const texto    = btnGuardar.querySelector(".btn-save__texto");
  const spinner  = btnGuardar.querySelector(".btn-save__spinner");
  btnGuardar.disabled = cargando;
  texto.textContent   = cargando ? "Guardando…" : "Guardar lugar";
  spinner.classList.toggle("hidden", !cargando);
}

// ── Guardar en Airtable ───────────────────────
async function guardarEnAirtable(datos) {
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(AIRTABLE_CONFIG.tableName)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_CONFIG.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          nombre:          datos.nombre,
          categoria:       datos.categoria,
          descripcion:     datos.descripcion,
          link_maps:       datos.link_maps        || undefined,
          link_red_social: datos.link_red_social  || undefined,
          visitado:        false,
          prioridad:       datos.prioridad,
          fecha_agregado:  datos.fecha_agregado,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error ${res.status}`);
  }

  return res.json();
}

// ── Submit ────────────────────────────────────
btnGuardar.addEventListener("click", async () => {
  if (!validarFormulario()) return;

  const prioRadio = document.querySelector('input[name="prioridad"]:checked');
  const hoy       = new Date().toISOString().split("T")[0];

  const datos = {
    nombre:          fNombre.value.trim(),
    categoria:       fCategoria.value,
    descripcion:     fDescripcion.value.trim(),
    link_maps:       fMaps.value.trim(),
    link_red_social: fSocial.value.trim(),
    prioridad:       prioRadio ? prioRadio.value : "media",
    fecha_agregado:  hoy,
  };

  const esModoDemo = !AIRTABLE_CONFIG.token || AIRTABLE_CONFIG.token === "TU_TOKEN_AQUI";

  setBtnGuardando(true);

  try {
    let nuevoId;

    if (esModoDemo) {
      // En modo demo: simular guardado local
      nuevoId = "demo-" + Date.now();
      await new Promise((r) => setTimeout(r, 600)); // simular delay
    } else {
      const record = await guardarEnAirtable(datos);
      nuevoId = record.id;
    }

    // Añadir al array local y re-renderizar
    todosLosLugares.unshift({ id: nuevoId, visitado: false, ...datos });
    renderizarVista();

    cerrarModal();
    mostrarToast(esModoDemo
      ? `"${datos.nombre}" guardado (modo demo)`
      : `"${datos.nombre}" guardado en Airtable 🎉`
    );

  } catch (err) {
    console.error("Error guardando:", err);
    mostrarToast("No se pudo guardar. Revisa tu conexión.", "error");
  } finally {
    setBtnGuardando(false);
  }
});

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
cargarLugares();
