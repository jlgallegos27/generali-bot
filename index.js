const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ─── CONFIGURACIÓN ───────────────────────────────────────────
const VERIFY_TOKEN = "generali_bot_2024";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

// ─── GOOGLE DRIVE ─────────────────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

const NUMERO_AGENTE = "34617722673";

const HORARIO_INICIO = 0;
const HORARIO_FIN_HORA = 23;
const HORARIO_FIN_MINUTO = 59;
const DIAS_LABORABLES = [0, 1, 2, 3, 4, 5, 6];

// ─── IMPORTS ─────────────────────────────────────────────────
const {
  PRODUCTS_DATA,
  detectarProducto,
  obtenerContextoProducto
} = require("./productsData");

// ─── ESTADO DE CONVERSACIONES ─────────────────────────────────
const conversaciones = new Set();
const esperandoSiniestro = new Map();
const esperandoDocAuto = new Map();
const contextoConversaciones = new Map();

// ─── RESPUESTAS FAQ ───────────────────────────────────────────
// Solo para operaciones directas: pagos, cuadro médico, horario.
// Todo lo relacionado con productos va a la IA.
const RESPUESTAS_FAQ = [
  {
    palabras: ["pago", "recibo", "factura", "cobro", "bizum", "tarjeta"],
    respuesta: "💳 *Pago de tu seguro Generali*\n\nPuedes realizar tu pago de forma fácil, rápida y segura:\n\n1️⃣ Entra en:\n🔗 https://www.generali.es/servicios-generali/pago-con-tarjeta/pasarela\n\n2️⃣ Introduce tu *número de recibo*\n\n3️⃣ Elige: 📱 *Bizum* o 💳 *Tarjeta bancaria*\n\n✅ El pago es 100% seguro y recibirás confirmación inmediata.\n\nSi tienes cualquier problema escríbeme y te ayudo. 😊"
  },
  {
    palabras: ["cuadro medico", "cuadro médico", "medicos", "médicos", "dentistas", "clinica", "clínica"],
    respuesta: "🏥 *Cuadro Médico Generali*\n\n🔗 Médicos y especialistas:\nhttps://www.generali.es/cuadromedico\n\n🦷 Dentistas:\nhttps://generali-dental.dentycard.es/clientes/landing\n\nSi necesitas ayuda para encontrar un especialista en tu zona, dímelo. 😊"
  },
  {
    palabras: ["horario", "hora", "cuando atiendes", "disponible", "cuando puedo llamar"],
    respuesta: "🕘 *Horario de atención*\n\nTu agente está disponible:\n📅 Lunes a Viernes · ⏰ 9:00h a 20:30h\n\nEste asistente está disponible *24 horas, 7 días a la semana*. 😊"
  },
  {
    palabras: ["gracias", "muchas gracias", "perfecto", "genial", "de acuerdo"],
    respuesta: "¡Con mucho gusto! 😊 Si necesitas cualquier otra cosa, aquí estamos. Escribe *1* para ver el menú."
  }
];

// ─── UTILIDADES ──────────────────────────────────────────────
function normalizarTexto(texto = "") {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function esSiniestroAuto(texto) {
  const textoNorm = normalizarTexto(texto);
  return ["coche", "auto", "carro", "vehiculo", "moto", "atropello",
    "colision", "choque", "accidente de trafico", "parte amistoso", "contrario"]
    .some(p => textoNorm.includes(p));
}

function buscarRespuestaFAQ(texto) {
  const textoNorm = normalizarTexto(texto);
  for (const faq of RESPUESTAS_FAQ) {
    if (faq.palabras.some(p => textoNorm.includes(p))) return faq.respuesta;
  }
  return null;
}

function esPreguntaCompleja(texto) {
  // Siempre true: cualquier mensaje con producto detectado va a la IA
  return true;
}
function esPreguntaComplejaOLD(texto) {
  const textoNorm = normalizarTexto(texto);
  const indicadores = [
    "cubre", "cubriria", "incluye", "excluye", "limite", "limites", "capital", "carencia",
    "copago", "franquicia", "indemnizacion", "garantia", "garantias", "condiciones",
    "diferencia", "comparar", "requisito", "puedo", "tengo derecho",
    "que pasa", "como funciona", "me conviene", "esta cubierto",
    "maternidad", "hospitalizacion", "rehabilitacion", "robo", "agua", "incendio",
    "lunas", "baja", "accidente", "cuesta", "precio", "coste", "informacion", "cuales"
  ];
  return texto.length >= 25 || texto.includes("?") ||
    indicadores.some(palabra => textoNorm.includes(palabra));
}

// ─── MEMORIA CORTA ────────────────────────────────────────────
function obtenerContextoConversacion(telefono) {
  return contextoConversaciones.get(telefono) || { productoId: null, mensajes: [] };
}

function guardarTurnoConversacion(telefono, productoId, pregunta, respuesta) {
  const contexto = obtenerContextoConversacion(telefono);
  const mensajes = [
    ...contexto.mensajes,
    { role: "user", content: pregunta },
    { role: "assistant", content: respuesta }
  ].slice(-8);
  contextoConversaciones.set(telefono, {
    productoId: productoId || contexto.productoId,
    mensajes,
    actualizado: Date.now()
  });
}

function limpiarContextosAntiguos() {
  const limite = Date.now() - 60 * 60 * 1000;
  for (const [telefono, contexto] of contextoConversaciones.entries()) {
    if ((contexto.actualizado || 0) < limite) contextoConversaciones.delete(telefono);
  }
}

// ─── GOOGLE DRIVE: OBTENER ACCESS TOKEN ──────────────────────
async function obtenerAccessTokenDrive() {
  try {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token"
    });
    return response.data.access_token;
  } catch (error) {
    console.error("❌ Error obteniendo access token Drive:", error.response?.data || error.message);
    return null;
  }
}

// ─── GOOGLE DRIVE: SUBIR IMAGEN ──────────────────────────────
async function subirImagenDrive(imageBuffer, nombreArchivo, mimeType = "image/jpeg") {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    console.warn("⚠️ Google Drive no configurado");
    return null;
  }

  try {
    const accessToken = await obtenerAccessTokenDrive();
    if (!accessToken) return null;

    // Metadata del archivo
    const metadata = {
      name: nombreArchivo,
      parents: GOOGLE_DRIVE_FOLDER_ID ? [GOOGLE_DRIVE_FOLDER_ID] : []
    };

    // Subir con multipart
    const boundary = "boundary_generali_bot";
    const metadataPart = JSON.stringify(metadata);

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
      Buffer.from(metadataPart),
      Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
      imageBuffer,
      Buffer.from(`\r\n--${boundary}--`)
    ]);

    const response = await axios.post(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
          "Content-Length": body.length
        },
        timeout: 30000
      }
    );

    const fileId = response.data.id;
    const webViewLink = response.data.webViewLink;

    // Hacer el archivo público para poder compartir el enlace
    await axios.post(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      { role: "reader", type: "anyone" },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log(`📁 Foto subida a Drive: ${nombreArchivo}`);
    return `https://drive.google.com/file/d/${fileId}/view`;

  } catch (error) {
    console.error("❌ Error subiendo a Drive:", error.response?.data || error.message);
    return null;
  }
}

// ─── IA: CONSULTA A ANTHROPIC ────────────────────────────────
async function consultarAnthropic(instrucciones, mensajes) {
  if (!ANTHROPIC_API_KEY) return null;
  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: ANTHROPIC_MODEL,
        max_tokens: 700,
        temperature: 0.2,
        system: instrucciones,
        messages: mensajes
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );
    return response.data?.content
      ?.filter(item => item.type === "text")
      ?.map(item => item.text)
      ?.join("\n")
      ?.trim() || null;
  } catch (error) {
    console.error("❌ Error consultando Anthropic:", error.response?.data || error.message);
    return null;
  }
}

async function consultarIA(productoId, pregunta, historial = []) {
  const contextoProducto = obtenerContextoProducto(productoId);
  if (!contextoProducto) {
    console.warn(`⚠️ Producto no encontrado: ${productoId}`);
    return null;
  }

  const nombreProducto = PRODUCTS_DATA[productoId]?.nombre || productoId;

  const instrucciones =
    `Eres el asistente de WhatsApp de Juan Luis Gallegos, agente exclusivo de Generali Seguros en Córdoba.\n` +
    `Responde solo con la información del producto facilitada como contexto. No inventes coberturas, precios, límites ni condiciones.\n` +
    `Si el contexto no permite responder con seguridad, dilo claramente y ofrece que el agente revise el caso.\n` +
    `Usa español de España, tono profesional y cercano, y formato breve apto para WhatsApp (máximo 5 puntos o frases).\n\n` +
    `Producto: ${nombreProducto}\n\n` +
    `Contexto del producto:\n${contextoProducto}`;

  const mensajes = [...historial, { role: "user", content: pregunta }].slice(-9);
  const respuesta = await consultarAnthropic(instrucciones, mensajes);
  if (!respuesta) return null;

  return `${respuesta}\n\nPara confirmar detalles concretos de tu póliza o preparar una cotización, tu agente puede revisarlo personalmente.`;
}

// ─── ENVÍO DE MENSAJES ────────────────────────────────────────
async function enviarMensaje(telefono, mensaje) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: telefono,
        type: "text",
        text: { body: mensaje },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`✉️  Enviado a ${telefono}`);
  } catch (error) {
    console.error("❌ Error enviando mensaje:", error.response?.data || error.message);
  }
}

// ─── PROCESAR IMAGEN: DESCARGA + DRIVE + NOTIFICACIÓN ────────
async function procesarImagen(telefono, mediaId, caption, esSiniestro = false) {
  try {
    // 1. Obtener URL de la imagen desde Meta
    const mediaRes = await axios.get(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
    const mediaUrl = mediaRes.data.url;

    // 2. Descargar la imagen
    const imageRes = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
    });
    const imageBuffer = Buffer.from(imageRes.data);

    // 3. Subir a Google Drive
    const fecha = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" })
      .replace(/[/:,\s]/g, "-");
    const tipo = esSiniestro ? "Siniestro" : "Foto";
    const nombreArchivo = `${tipo}_${telefono}_${fecha}.jpg`;

    const urlDrive = await subirImagenDrive(imageBuffer, nombreArchivo);

    // 4. Notificar al agente
    if (urlDrive) {
      await enviarMensaje(NUMERO_AGENTE,
        `📸 *${tipo} de cliente*\n\n` +
        `📱 +${telefono}\n` +
        `${caption ? `💬 "${caption}"\n` : ""}` +
        `📁 *Ver en Drive:*\n${urlDrive}`
      );
    } else {
      await enviarMensaje(NUMERO_AGENTE,
        `📸 *${tipo} de cliente* +${telefono}\n` +
        `${caption ? `💬 "${caption}"\n` : ""}` +
        `⚠️ No se pudo subir a Drive automáticamente.`
      );
    }

    return urlDrive;
  } catch (error) {
    console.error("❌ Error procesando imagen:", error.message);
    await enviarMensaje(NUMERO_AGENTE,
      `📸 El cliente +${telefono} ha enviado una imagen (no se pudo procesar automáticamente).`
    );
    return null;
  }
}

async function notificarAgente(telefono, mensaje, tipo) {
  const hora = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }))
    .toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const iconos  = { urgente: "🔴", importante: "🟡", consulta: "🟢" };
  const titulos = { urgente: "Siniestro URGENTE", importante: "Siniestro IMPORTANTE", consulta: "Consulta sobre siniestro" };
  await enviarMensaje(NUMERO_AGENTE,
    `${iconos[tipo] || "🔔"} *${titulos[tipo] || "Notificación"}*\n\n` +
    `📱 Número: +${telefono}\n💬 "${mensaje}"\n🕘 ${hora}`
  );
}

// ─── WEBHOOK: VERIFICACIÓN META ───────────────────────────────
app.get("/webhook", (req, res) => {
  const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ─── WEBHOOK: RECEPCIÓN DE MENSAJES ──────────────────────────
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const mensaje = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!mensaje) return;

    const telefono = mensaje.from;
    const tipo     = mensaje.type;
    const esAgente = telefono === NUMERO_AGENTE;

    // ── AUDIO ──
    if (tipo === "audio") {
      await enviarMensaje(telefono,
        "🚫 *Los mensajes de voz no son válidos.*\n\n" +
        "Por favor escribe tu consulta en texto. 📝\n\n" +
        "1️⃣ Información · 2️⃣ Cotización · 3️⃣ Pago · 4️⃣ Agente · 5️⃣ Siniestro"
      );
      return;
    }

    // ── IMÁGENES ──
    if (tipo === "image") {
      const mediaId = mensaje.image?.id;
      const caption = mensaje.image?.caption || "";
      const esSiniestro = esperandoDocAuto.has(telefono);

      const urlDrive = await procesarImagen(telefono, mediaId, caption, esSiniestro);

      if (esSiniestro) {
        await enviarMensaje(telefono,
          `✅ Foto recibida y guardada. 📸\n\n` +
          `¿Tienes más fotos o datos que añadir?\n\n` +
          `Cuando termines escribe *listo*. 😊`
        );
      } else {
        await enviarMensaje(telefono, "✅ Imagen recibida y enviada a tu agente. 😊");
      }
      return;
    }

    // ── OTROS TIPOS ──
    if (tipo !== "text") {
      await enviarMensaje(telefono,
        "🚫 Solo se admiten *texto e imágenes*. Por favor escribe tu consulta. 📝"
      );
      return;
    }

    const texto   = mensaje.text.body.trim();
    const esNuevo = !conversaciones.has(telefono);
    console.log(`📩 [${telefono}] ${texto}`);

    // ── ESPEJO AL AGENTE ──
    if (!esAgente) {
      const hora = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }))
        .toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      await enviarMensaje(NUMERO_AGENTE,
        `📩 *Mensaje de cliente*\n\n📱 +${telefono}\n💬 "${texto}"\n🕘 ${hora}`
      );
    }

    // ── FLUJO DOC AUTO ──
    if (esperandoDocAuto.has(telefono)) {
      const norm = normalizarTexto(texto);
      if (["listo", "ya esta", "es todo", "nada mas"].some(p => norm.includes(p))) {
        esperandoDocAuto.delete(telefono);
        await enviarMensaje(NUMERO_AGENTE, `✅ Cliente +${telefono} terminó de enviar documentación del siniestro de auto.`);
        await enviarMensaje(telefono,
          "✅ Tu agente ha recibido toda la documentación y procederá con la gestión.\n\nTe contactará lo antes posible. 💪\n\n🆘 Urgente: *911 123 443* (24h)"
        );
      } else {
        await enviarMensaje(NUMERO_AGENTE, `📋 Datos siniestro auto de +${telefono}:\n"${texto}"`);
        await enviarMensaje(telefono,
          "✅ Datos enviados a tu agente. 😊\n\n¿Más información o fotos? Cuando termines escribe *listo*."
        );
      }
      return;
    }

    // ── FLUJO SINIESTRO: NIVEL ──
    if (esperandoSiniestro.has(telefono) && esperandoSiniestro.get(telefono) === "nivel") {
      if (["1", "2", "3"].includes(texto)) {
        const nivel = texto === "1" ? "urgente" : texto === "2" ? "importante" : "consulta";
        esperandoSiniestro.set(telefono, nivel);
        await enviarMensaje(telefono,
          `${texto === "1" ? "🔴" : texto === "2" ? "🟡" : "🟢"} Entendido.\n\n` +
          "Descríbeme el siniestro:\n\n" +
          "📋 ¿Qué tipo? (agua, incendio, robo, auto...)\n" +
          "📍 ¿Dónde?\n📅 ¿Cuándo?\n🔍 ¿Qué daños?\n" +
          "👤 Tu nombre completo\n🪪 Número de póliza (si lo tienes)\n\n" +
          (texto === "1" ? "⚠️ Riesgo inmediato: llama ya al *911 123 443* (24h)\n\n" : "") +
          "⚠️ *Solo texto e imágenes, no se admiten mensajes de voz.*"
        );
      } else {
        await enviarMensaje(telefono,
          "Por favor elige una opción válida:\n\n🔴 *1* Urgente · 🟡 *2* Importante · 🟢 *3* Consulta"
        );
      }
      return;
    }

    // ── FLUJO SINIESTRO: DESCRIPCIÓN ──
    if (esperandoSiniestro.has(telefono) && esperandoSiniestro.get(telefono) !== "nivel") {
      const nivel = esperandoSiniestro.get(telefono);
      esperandoSiniestro.delete(telefono);
      await notificarAgente(telefono, texto, nivel);

      if (esSiniestroAuto(texto)) {
        esperandoDocAuto.set(telefono, true);
        await enviarMensaje(telefono,
          "✅ Siniestro registrado y agente avisado.\n\n" +
          "🚗 *Siniestro de auto detectado.* Necesito:\n\n" +
          "📸 *Opción A — Parte amistoso:* foto del parte firmado\n\n" +
          "📝 *Opción B — Datos del contrario:*\n" +
          "👤 Nombre · 🪪 DNI · 🚘 Matrícula · 🏢 Aseguradora · 📋 Póliza\n\n" +
          "También puedes enviar fotos de los daños.\n\n" +
          "Cuando termines escribe *listo*. 😊"
        );
      } else {
        const mensajes = {
          urgente:    "✅ Siniestro registrado y agente avisado.\n\n🔴 Si hay riesgo activo llama ahora:\n📞 *911 123 443* (gratuito · 24h)\n\nTu agente contactará contigo lo antes posible. 💪",
          importante: "✅ Siniestro registrado y agente avisado.\n\nTe contactará lo antes posible.\n\nSi empeora: 📞 *911 123 443* (24h) 🆘",
          consulta:   "✅ Consulta registrada y agente avisado.\n\nTe responderá en horario de atención _(L-V 9h-20:30h)_. 😊",
        };
        await enviarMensaje(telefono, mensajes[nivel]);
      }
      return;
    }

    // ── BIENVENIDA ──
    if (esNuevo) {
      conversaciones.add(telefono);
      await enviarMensaje(telefono,
        "👋 ¡Hola! Bienvenido/a al asistente de tu agente de *Generali Seguros*.\n\n" +
        "Estoy aquí para ayudarte 24/7. Tu agente atiende personalmente de *L-V de 9h a 20:30h*.\n\n" +
        "⚠️ *Solo texto e imágenes. Los mensajes de voz no son válidos.*\n\n" +
        "¿Cómo puedo ayudarte?\n\n" +
        "1️⃣ Información sobre seguros\n2️⃣ Solicitar cotización\n3️⃣ Realizar un pago\n4️⃣ Hablar con el agente\n5️⃣ Reportar un siniestro"
      );
      return;
    }

    // ── MENÚ SINIESTRO ──
    if (texto === "5" || ["siniestro", "accidente", "urgente"].some(p => texto.toLowerCase().includes(p))) {
      esperandoSiniestro.set(telefono, "nivel");
      if (!conversaciones.has(telefono)) conversaciones.add(telefono);
      await enviarMensaje(telefono,
        "🆘 *Reportar un siniestro*\n\n¿Cuál es el nivel de urgencia?\n\n" +
        "🔴 *1 — URGENTE:* Daños activos, heridos o riesgo inmediato\n" +
        "🟡 *2 — IMPORTANTE:* Daño ya ocurrido, sin riesgo activo\n" +
        "🟢 *3 — CONSULTA:* Dudas sobre cobertura o tramitación\n\n" +
        "⚠️ *Solo texto e imágenes, no se admiten mensajes de voz.*"
      );
      return;
    }

    // ── MENÚS 1-4 ──
    const menus = {
      "1": "¿Sobre qué tipo de seguro necesitas información?\n\n🏠 *Hogar* · 🚗 *Auto* · ❤️ *Vida* · 🏥 *Salud* · 🦷 *Dental* · 🏢 *Empresas* · 💰 *Ahorro*\n\nEscríbeme el que te interesa y te cuento todo.",
      "2": "📋 *Solicitar cotización*\n\nDime qué tipo de seguro te interesa y te indico la documentación que necesitamos:\n\n🏠 Hogar · 🚗 Auto · ❤️ Vida · 🏥 Salud · 🏢 Empresas · 💰 Ahorro",
      "3": "💳 *Pago de tu seguro Generali*\n\n1️⃣ Entra en:\n🔗 https://www.generali.es/servicios-generali/pago-con-tarjeta/pasarela\n\n2️⃣ Introduce tu *número de recibo*\n\n3️⃣ Elige: 📱 *Bizum* o 💳 *Tarjeta bancaria*\n\n✅ Pago 100% seguro con confirmación inmediata. 😊",
      "4": "Perfecto, voy a avisar a tu agente. ⏳\n\n¿Puedes indicarme tu *nombre* y el *motivo* de la consulta?\n\n🕘 Agente disponible *L-V de 9h a 20:30h*",
    };
    if (menus[texto]) {
      await enviarMensaje(telefono, menus[texto]);
      return;
    }

    // ── FAQ BÁSICO ──
    const respuestaFAQ = buscarRespuestaFAQ(texto);
    if (respuestaFAQ) {
      await enviarMensaje(telefono, respuestaFAQ);
      return;
    }

    // ── IA: CONSULTAS SOBRE PRODUCTOS (último recurso) ──
    limpiarContextosAntiguos();
    const contextoCliente = obtenerContextoConversacion(telefono);
    const productoIdDetectado = detectarProducto(texto);
    const productoIdParaIA = productoIdDetectado || contextoCliente.productoId;

    if (productoIdParaIA && esPreguntaCompleja(texto)) {
      const respuestaIA = await consultarIA(productoIdParaIA, texto, contextoCliente.mensajes);
      if (respuestaIA) {
        guardarTurnoConversacion(telefono, productoIdParaIA, texto, respuestaIA);
        await enviarMensaje(telefono, respuestaIA);
        console.log(`🤖 IA [${productoIdParaIA}] → ${telefono}`);
        return;
      }
    }

    // ── RESPUESTA GENÉRICA ──
    await enviarMensaje(telefono,
      "Gracias por tu mensaje. 😊\n\n" +
      "Para darte la mejor atención, elige una opción:\n\n" +
      "1️⃣ Información sobre seguros\n2️⃣ Solicitar cotización\n3️⃣ Realizar un pago\n4️⃣ Hablar con el agente\n5️⃣ Reportar un siniestro"
    );

  } catch (error) {
    console.error("❌ Error en webhook:", error);
  }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "✅ Bot Generali Seguros activo",
    ia: ANTHROPIC_API_KEY ? `✅ Claude AI (${ANTHROPIC_MODEL})` : "⚠️ ANTHROPIC_API_KEY no configurada",
    drive: GOOGLE_REFRESH_TOKEN ? "✅ Google Drive conectado" : "⚠️ Google Drive no configurado",
    productos_cargados: Object.keys(PRODUCTS_DATA).length,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot Generali Seguros corriendo en puerto ${PORT}`));
