const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ─── CONFIGURACIÓN ───────────────────────────────────────────
const VERIFY_TOKEN = "generali_bot_2024";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// FIX 1: modelo correcto según instrucciones (variable de entorno o fallback)
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

const NUMERO_AGENTE = "34617722673";

const HORARIO_INICIO = 0;
const HORARIO_FIN_HORA = 23;
const HORARIO_FIN_MINUTO = 59;
const DIAS_LABORABLES = [0, 1, 2, 3, 4, 5, 6];

// FIX 2: import correcto — desestructurar lo que realmente exporta productsData.js
const {
  PRODUCTS_DATA,
  detectarProducto,
  obtenerContextoProducto
} = require("./productsData");

// ─── ESTADO DE CONVERSACIONES ─────────────────────────────────
const conversaciones = new Set();
const esperandoSiniestro = new Map();
const esperandoDocAuto = new Map();
const contextoConversaciones = new Map(); // telefono → { productoId, mensajes, actualizado }

// ─── RESPUESTAS PREDEFINIDAS POR PALABRAS CLAVE ──────────────
const RESPUESTAS_FAQ = [
  {
    palabras: ["hogar", "casa", "vivienda", "piso", "apartamento"],
    respuesta: "🏠 *Seguro de Hogar Generali*\n\nNuestro seguro de hogar cubre daños por agua, incendio, robo, responsabilidad civil y mucho más.\n\nPara prepararte una cotización personalizada necesito:\n\n👤 Nombre completo\n🪪 DNI\n🎂 Fecha de nacimiento\n📍 Dirección completa\n📐 Metros cuadrados\n🏘️ ¿Piso o casa?\n\nEnvíame estos datos y tu agente te preparará la mejor oferta. 😊"
  },
  {
    palabras: ["auto", "coche", "carro", "vehículo", "vehiculo", "automóvil", "automovil"],
    respuesta: "🚗 *Seguro de Auto Generali*\n\nOfrecemos coberturas a terceros, todo riesgo y modalidades intermedias adaptadas a tu perfil.\n\nPara prepararte una cotización necesito:\n\n👤 Nombre completo\n🪪 DNI\n🎂 Fecha de nacimiento\n📍 Dirección completa\n🚘 Marca, modelo y año del vehículo\n📋 Matrícula\n\n📸 Documentación:\n📷 DNI (anverso y reverso)\n📷 Permiso de conducir (anverso y reverso)\n📷 Ficha técnica\n📷 Permiso de circulación\n📷 Póliza anterior (si tienes)\n\n⚠️ Tus datos son tratados con total confidencialidad conforme a la LOPD. 😊"
  },
  {
    palabras: ["vida", "fallecimiento", "muerte", "deceso", "supervivencia"],
    respuesta: "❤️ *Seguro de Vida Generali*\n\nProtege a tu familia con nuestros seguros de vida. Disponemos de distintas modalidades según tus necesidades y presupuesto.\n\nPara prepararte una cotización necesito:\n\n👤 Nombre completo\n🪪 DNI\n🎂 Fecha de nacimiento\n📍 Dirección completa\n💰 Capital que deseas asegurar\n\nEnvíame estos datos y tu agente te preparará varias opciones. 😊"
  },
  {
    palabras: ["dental", "dentista", "dientes", "boca", "ortodoncia"],
    respuesta: "🦷 *Cobertura Dental Generali*\n\nConsulta nuestra red de dentistas colaboradores:\n\n🔗 https://generali-dental.dentycard.es/clientes/landing\n\nPara incluir cobertura dental en tu seguro de salud necesito:\n\n👤 Nombre completo\n🪪 DNI\n🎂 Fecha de nacimiento\n📍 Dirección completa\n👨‍👩‍👧 ¿Es solo para ti o también para familiares?\n\nEnvíame estos datos y tu agente te preparará la mejor opción. 😊"
  },
  {
    palabras: ["salud", "médico", "medico", "médica", "medica", "sanitario", "hospital", "especialista"],
    respuesta: "🏥 *Seguro de Salud Generali*\n\nAccede a los mejores especialistas sin listas de espera.\n\n🔗 Consulta el cuadro médico completo:\nhttps://www.generali.es/cuadromedico\n\nPara prepararte una cotización necesito:\n\n👤 Nombre completo\n🪪 DNI\n🎂 Fecha de nacimiento\n📍 Dirección completa\n👨‍👩‍👧 ¿Es solo para ti o también para familiares?\n\nEnvíame estos datos y tu agente te contactará enseguida. 😊"
  },
  {
    palabras: ["empresa", "pyme", "comercio", "local", "oficina", "autonomo", "autónomo"],
    respuesta: "🏢 *Seguro de Empresas Generali*\n\nProtege tu negocio con coberturas adaptadas: responsabilidad civil, daños materiales, pérdida de beneficios y más.\n\nPara prepararte una cotización necesito:\n\n👤 Nombre completo\n🪪 DNI\n🎂 Fecha de nacimiento\n📍 Dirección del negocio\n🏭 Actividad de la empresa\n👥 Número de empleados\n\nEnvíame estos datos y tu agente te contactará enseguida. 😊"
  },
  {
    palabras: ["ahorro", "inversión", "inversion", "plan", "jubilación", "jubilacion", "pensión", "pension", "futuro"],
    respuesta: "💰 *Seguros de Ahorro e Inversión Generali*\n\nPlanifica tu futuro con rentabilidad garantizada y ventajas fiscales.\n\nPara prepararte una propuesta personalizada necesito:\n\n👤 Nombre completo\n🪪 DNI\n🎂 Fecha de nacimiento\n📍 Dirección completa\n💰 Cantidad que deseas ahorrar mensualmente\n\nEnvíame estos datos y tu agente te contactará enseguida. 😊"
  },
  {
    palabras: ["pago", "recibo", "factura", "cobro", "bizum", "tarjeta"],
    respuesta: "💳 *Pago de tu seguro Generali*\n\nPuedes realizar tu pago de forma fácil, rápida y segura:\n\n*Pasos a seguir:*\n1️⃣ Entra en el siguiente enlace:\n🔗 https://www.generali.es/servicios-generali/pago-con-tarjeta/pasarela\n\n2️⃣ Introduce tu *número de recibo* (lo encuentras en tu carta de pago)\n\n3️⃣ Elige tu forma de pago:\n📱 *Bizum*\n💳 *Tarjeta bancaria*\n\n✅ El pago es 100% seguro y recibirás confirmación inmediata.\n\nSi tienes cualquier problema escríbeme y te ayudo. 😊"
  },
  {
    palabras: ["cuadro", "medicos", "médicos", "especialistas", "clinica", "clínica"],
    respuesta: "🏥 *Cuadro Médico Generali*\n\n🔗 Médicos y especialistas:\nhttps://www.generali.es/cuadromedico\n\n🦷 Dentistas:\nhttps://generali-dental.dentycard.es/clientes/landing\n\nSi necesitas ayuda para encontrar un especialista en tu zona, dímelo y te ayudo. 😊"
  },
  {
    palabras: ["precio", "coste", "costo", "cuánto", "cuanto", "presupuesto", "cotización", "cotizacion"],
    respuesta: "📋 *Solicitar cotización*\n\nCon mucho gusto preparamos un presupuesto personalizado.\n\nDime primero:\n¿Qué tipo de seguro te interesa?\n\n🏠 Hogar · 🚗 Auto · ❤️ Vida · 🏥 Salud · 🏢 Empresas · 💰 Ahorro\n\nAsí te indico exactamente qué documentación necesitamos. 😊"
  },
  {
    palabras: ["horario", "hora", "cuando", "cuándo", "disponible", "atención", "atencion"],
    respuesta: "🕘 *Horario de atención*\n\nTu agente está disponible:\n📅 Lunes a Viernes\n⏰ 9:00h a 20:30h\n\nEste asistente está disponible *24 horas, 7 días a la semana* para ayudarte. 😊"
  },
  {
    palabras: ["gracias", "ok", "vale", "perfecto", "genial", "bien"],
    respuesta: "¡Con mucho gusto! 😊 Si necesitas cualquier otra cosa, aquí estamos. Escribe *1* para ver el menú de opciones."
  }
];

// ─── UTILIDADES ──────────────────────────────────────────────
function normalizarTexto(texto = "") {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function estaEnHorario() {
  const horaES = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const hora = horaES.getHours();
  const minuto = horaES.getMinutes();
  const dia = horaES.getDay();
  const totalMinutos = hora * 60 + minuto;
  return DIAS_LABORABLES.includes(dia) &&
    totalMinutos >= HORARIO_INICIO * 60 &&
    totalMinutos <= HORARIO_FIN_HORA * 60 + HORARIO_FIN_MINUTO;
}

function esSiniestroAuto(texto) {
  const textoNorm = normalizarTexto(texto);
  const palabrasAuto = ["coche", "auto", "carro", "vehiculo", "moto", "atropello",
    "colision", "choque", "accidente de trafico", "parte amistoso", "contrario"];
  return palabrasAuto.some(p => textoNorm.includes(p));
}

function buscarRespuestaFAQ(texto) {
  const textoNorm = normalizarTexto(texto);
  for (const faq of RESPUESTAS_FAQ) {
    if (faq.palabras.some(p => textoNorm.includes(p))) return faq.respuesta;
  }
  return null;
}

function esPreguntaCompleja(texto) {
  const textoNorm = normalizarTexto(texto);
  const indicadores = [
    "cubre", "cubriria", "incluye", "excluye", "limite", "limites", "capital", "carencia",
    "copago", "franquicia", "indemnizacion", "garantia", "garantias", "condiciones",
    "diferencia", "comparar", "requisito", "puedo", "tengo derecho",
    "que pasa", "como funciona", "me conviene", "esta cubierto",
    "maternidad", "hospitalizacion", "rehabilitacion", "robo", "agua", "incendio",
    "lunas", "baja", "accidente"
  ];
  return texto.length >= 35 || texto.includes("?") ||
    indicadores.some(palabra => textoNorm.includes(palabra));
}

// ─── MEMORIA CORTA DE CONVERSACIÓN ───────────────────────────
function obtenerContextoConversacion(telefono) {
  return contextoConversaciones.get(telefono) || { productoId: null, mensajes: [] };
}

function guardarTurnoConversacion(telefono, productoId, pregunta, respuesta) {
  const contexto = obtenerContextoConversacion(telefono);
  const mensajes = [
    ...contexto.mensajes,
    { role: "user", content: pregunta },
    { role: "assistant", content: respuesta }
  ].slice(-8); // máximo 4 turnos

  contextoConversaciones.set(telefono, {
    productoId: productoId || contexto.productoId,
    mensajes,
    actualizado: Date.now()
  });
}

function limpiarContextosAntiguos() {
  const limite = Date.now() - 60 * 60 * 1000; // 1 hora
  for (const [telefono, contexto] of contextoConversaciones.entries()) {
    if ((contexto.actualizado || 0) < limite) contextoConversaciones.delete(telefono);
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

// FIX 3: consultarIA recibe productoId (string) y usa obtenerContextoProducto del módulo
async function consultarIA(productoId, pregunta, historial = []) {
  // FIX 3a: usar obtenerContextoProducto() del módulo para construir el contexto
  const contextoProducto = obtenerContextoProducto(productoId);
  if (!contextoProducto) {
    console.warn(`⚠️ Producto no encontrado en productsData: ${productoId}`);
    return null;
  }

  const nombreProducto = PRODUCTS_DATA[productoId]?.nombre || productoId;

  const instrucciones =
    `Eres el asistente de WhatsApp de Juan Luis Gallegos, agente exclusivo de Generali Seguros en Córdoba.\n` +
    `Responde solo con la información del producto facilitada como contexto. No inventes coberturas, precios, límites ni condiciones.\n` +
    `Si el contexto no permite responder con seguridad, dilo claramente y ofrece que el agente revise el caso.\n` +
    `Puedes usar el historial reciente solo para entender referencias como "ese seguro", "y eso", "la carencia" o "el anterior".\n` +
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
    console.log(`✉️  Mensaje enviado a ${telefono}`);
  } catch (error) {
    console.error("❌ Error enviando mensaje:", error.response?.data || error.message);
  }
}

async function reenviarImagen(telefono, mediaId, caption) {
  try {
    const mediaRes = await axios.get(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
    const imageRes = await axios.get(mediaRes.data.url, {
      responseType: "arraybuffer",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
    });
    const imageBase64 = Buffer.from(imageRes.data).toString("base64");
    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: NUMERO_AGENTE,
        type: "image",
        image: { data: imageBase64, caption: caption || `📸 Imagen de siniestro de +${telefono}` }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`📸 Imagen reenviada al agente`);
  } catch (error) {
    console.error("❌ Error reenviando imagen:", error.response?.data || error.message);
    await enviarMensaje(NUMERO_AGENTE, `📸 El cliente +${telefono} ha enviado una imagen de su siniestro (no se pudo reenviar automáticamente).`);
  }
}

async function notificarAgente(telefono, mensaje, tipo) {
  const horaES = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const hora = horaES.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const iconos = { "urgente": "🔴", "importante": "🟡", "consulta": "🟢" };
  const titulos = { "urgente": "Siniestro URGENTE", "importante": "Siniestro IMPORTANTE", "consulta": "Consulta sobre siniestro" };
  await enviarMensaje(NUMERO_AGENTE,
    `${iconos[tipo] || "🔔"} *${titulos[tipo] || "Notificación"}*\n\n` +
    `📱 Número: +${telefono}\n💬 Descripción: "${mensaje}"\n🕘 Hora: ${hora}`
  );
}

// ─── WEBHOOK: VERIFICACIÓN DE META ───────────────────────────
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado por Meta");
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
    const tipo = mensaje.type;
    const esAgente = telefono === NUMERO_AGENTE;

    // ── MENSAJES DE VOZ ──
    if (tipo === "audio") {
      await enviarMensaje(telefono,
        `🚫 *Los mensajes de voz no son válidos para gestionar tu consulta.*\n\n` +
        `⚠️ Para que podamos atenderte correctamente y dejar constancia de tu solicitud, es *obligatorio* comunicarse mediante *mensajes de texto o imágenes*.\n\n` +
        `Por favor, escribe tu consulta en texto. 📝\n\n` +
        `Si necesitas ayuda, elige una opción:\n\n` +
        `1️⃣ Información sobre seguros\n2️⃣ Solicitar cotización\n3️⃣ Realizar un pago\n4️⃣ Hablar con el agente\n5️⃣ Reportar un siniestro`
      );
      return;
    }

    // ── IMÁGENES ──
    if (tipo === "image") {
      const mediaId = mensaje.image?.id;
      const caption = mensaje.image?.caption || "";
      if (esperandoDocAuto.has(telefono)) {
        await reenviarImagen(telefono, mediaId, `📸 Siniestro auto de +${telefono}: ${caption}`);
        await enviarMensaje(telefono,
          `✅ Imagen recibida y enviada a tu agente. 📸\n\n` +
          `¿Tienes más fotos o datos que añadir?\n\n` +
          `Si has terminado escribe *"listo"* y tu agente iniciará la gestión. 😊`
        );
      } else {
        await reenviarImagen(telefono, mediaId, `📸 Imagen de +${telefono}: ${caption}`);
        await enviarMensaje(telefono, `✅ Imagen recibida y enviada a tu agente. 😊`);
      }
      return;
    }

    // ── OTROS TIPOS DE ARCHIVO ──
    if (tipo !== "text") {
      await enviarMensaje(telefono,
        `🚫 *Los mensajes de voz no son válidos para gestionar tu consulta.*\n\n` +
        `⚠️ Por favor, comunícate mediante *texto escrito o imágenes* únicamente.\n\n` +
        `Escribe tu consulta en texto. 📝`
      );
      return;
    }

    const texto = mensaje.text.body.trim();
    const esNuevo = !conversaciones.has(telefono);
    console.log(`📩 [${telefono}] ${texto}`);

    // ── ESPEJO: REENVIAR TODOS LOS MENSAJES AL AGENTE ──
    if (!esAgente) {
      const horaES = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
      const hora = horaES.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      await enviarMensaje(NUMERO_AGENTE,
        `📩 *Mensaje de cliente*\n\n📱 +${telefono}\n💬 "${texto}"\n🕘 ${hora}`
      );
    }

    // ── FLUJO DOC AUTO: ESPERANDO "LISTO" O MÁS DATOS ──
    if (esperandoDocAuto.has(telefono)) {
      const textoNorm = normalizarTexto(texto);
      if (["listo", "ya esta", "es todo", "nada mas"].some(p => textoNorm.includes(p))) {
        esperandoDocAuto.delete(telefono);
        await enviarMensaje(NUMERO_AGENTE, `✅ El cliente +${telefono} ha terminado de enviar documentación del siniestro de auto.`);
        await enviarMensaje(telefono,
          `✅ Perfecto, tu agente ha recibido toda la documentación y procederá con la gestión del siniestro.\n\n` +
          `Te contactará lo antes posible. 💪\n\n` +
          `🆘 Si la situación es urgente: *911 123 443* (24h)`
        );
      } else {
        await enviarMensaje(NUMERO_AGENTE, `📋 Datos siniestro auto de +${telefono}:\n"${texto}"`);
        await enviarMensaje(telefono,
          `✅ Datos recibidos y enviados a tu agente. 😊\n\n` +
          `¿Tienes más información o fotos que añadir?\nCuando termines escribe *"listo"*.`
        );
      }
      return;
    }

    // ── FLUJO SINIESTRO: ESPERANDO NIVEL DE URGENCIA ──
    if (esperandoSiniestro.has(telefono) && esperandoSiniestro.get(telefono) === "nivel") {
      if (["1", "2", "3"].includes(texto)) {
        const nivel = texto === "1" ? "urgente" : texto === "2" ? "importante" : "consulta";
        esperandoSiniestro.set(telefono, nivel);
        await enviarMensaje(telefono,
          `${texto === "1" ? "🔴" : texto === "2" ? "🟡" : "🟢"} Entendido.\n\n` +
          `Para que tu agente pueda gestionar y hacer el seguimiento, descríbeme:\n\n` +
          `📋 ¿Qué tipo de siniestro es? (agua, incendio, robo, accidente de auto...)\n` +
          `📍 ¿Dónde ha ocurrido?\n📅 ¿Cuándo ocurrió?\n🔍 ¿Qué daños hay?\n` +
          `👤 Tu nombre completo\n🪪 Tu número de póliza (si lo tienes)\n\n` +
          `${texto === "1" ? "⚠️ Si hay riesgo inmediato llama ya al *911 123 443* (24h)\n\n" : ""}` +
          `⚠️ *Recuerda: solo texto e imágenes, no se admiten mensajes de voz.*`
        );
      } else {
        await enviarMensaje(telefono, "Por favor elige una opción válida:\n\n🔴 *1* - Urgente\n🟡 *2* - Importante\n🟢 *3* - Consulta");
      }
      return;
    }

    // ── FLUJO SINIESTRO: ESPERANDO DESCRIPCIÓN ──
    if (esperandoSiniestro.has(telefono) && esperandoSiniestro.get(telefono) !== "nivel") {
      const nivel = esperandoSiniestro.get(telefono);
      esperandoSiniestro.delete(telefono);
      await notificarAgente(telefono, texto, nivel);
      if (esSiniestroAuto(texto)) {
        esperandoDocAuto.set(telefono, true);
        await enviarMensaje(telefono,
          `✅ He registrado tu siniestro y avisado a tu agente.\n\n` +
          `🚗 *Veo que es un siniestro de auto.* Para agilizar la gestión necesito:\n\n` +
          `📸 *Opción A — Parte amistoso:*\nEnvíame una foto del parte amistoso firmado\n\n` +
          `📝 *Opción B — Datos del contrario:*\n👤 Nombre completo\n🪪 DNI\n🚘 Matrícula\n🏢 Compañía aseguradora\n📋 Número de póliza\n\n` +
          `También puedes enviar fotos de los daños del vehículo.\n\n` +
          `⚠️ *Solo texto e imágenes, no se admiten mensajes de voz.*\n\n` +
          `Cuando termines de enviar todo escribe *"listo"*. 😊`
        );
      } else {
        if (nivel === "urgente") {
          await enviarMensaje(telefono,
            `✅ He registrado tu siniestro y avisado a tu agente para el seguimiento.\n\n` +
            `🔴 *Recuerda:* Si hay riesgo activo llama ahora al:\n📞 *911 123 443* (gratuito · 24h)\n\nTu agente contactará contigo lo antes posible. 💪`
          );
        } else if (nivel === "importante") {
          await enviarMensaje(telefono,
            `✅ He registrado tu siniestro y avisado a tu agente para hacer el seguimiento.\n\nTe contactará lo antes posible.\n\nSi la situación empeora: 📞 *911 123 443* (24h) 🆘`
          );
        } else {
          await enviarMensaje(telefono,
            `✅ He registrado tu consulta y avisado a tu agente.\n\nTe responderá durante el horario de atención _(L-V 9h-20:30h)_. 😊`
          );
        }
      }
      return;
    }

    // ── BIENVENIDA ──
    if (esNuevo) {
      conversaciones.add(telefono);
      await enviarMensaje(telefono,
        `👋 ¡Hola! Bienvenido/a al asistente de tu agente de *Generali Seguros*.\n\n` +
        `Estoy aquí para ayudarte 24/7. Tu agente atiende personalmente de *L-V de 9h a 20:30h*.\n\n` +
        `⚠️ *Importante: solo se admiten mensajes de texto e imágenes. Los mensajes de voz no son válidos.*\n\n` +
        `¿Cómo puedo ayudarte?\n\n` +
        `1️⃣ Información sobre seguros\n2️⃣ Solicitar cotización\n3️⃣ Realizar un pago\n4️⃣ Hablar con el agente\n5️⃣ Reportar un siniestro`
      );
      return;
    }

    // ── MENÚ RÁPIDO ──
    if (texto === "5" || texto.toLowerCase().includes("siniestro") ||
        texto.toLowerCase().includes("accidente") || texto.toLowerCase().includes("urgente")) {
      esperandoSiniestro.set(telefono, "nivel");
      if (!conversaciones.has(telefono)) conversaciones.add(telefono);
      await enviarMensaje(telefono,
        `🆘 *Reportar un siniestro*\n\n` +
        `Para atenderte mejor, dime el nivel de urgencia:\n\n` +
        `🔴 *1 - URGENTE*\nDaños activos, heridos o riesgo inmediato\n\n` +
        `🟡 *2 - IMPORTANTE*\nDaño ya ocurrido, sin riesgo activo\n\n` +
        `🟢 *3 - CONSULTA*\nDudas sobre cobertura o tramitación\n\n` +
        `⚠️ *Solo texto e imágenes, no se admiten mensajes de voz.*`
      );
      return;
    }

    const menus = {
      "1": "¿Sobre qué tipo de seguro necesitas información?\n\n🏠 *Hogar* · 🚗 *Auto* · ❤️ *Vida* · 🏥 *Salud* · 🦷 *Dental* · 🏢 *Empresas* · 💰 *Ahorro*\n\nEscríbeme el que te interese y te cuento todo.",
      "2": "📋 *Solicitar cotización*\n\nDime qué tipo de seguro te interesa y te indico exactamente qué documentación necesitamos:\n\n🏠 Hogar · 🚗 Auto · ❤️ Vida · 🏥 Salud · 🏢 Empresas · 💰 Ahorro",
      "3": "💳 *Pago de tu seguro Generali*\n\nPuedes realizar tu pago de forma fácil, rápida y segura:\n\n1️⃣ Entra en:\n🔗 https://www.generali.es/servicios-generali/pago-con-tarjeta/pasarela\n\n2️⃣ Introduce tu *número de recibo*\n\n3️⃣ Elige:\n📱 *Bizum* o 💳 *Tarjeta bancaria*\n\n✅ Pago 100% seguro con confirmación inmediata. 😊",
      "4": "Perfecto, voy a avisar a tu agente ahora mismo. ⏳\n\n¿Puedes indicarme tu *nombre* y el *motivo* de la consulta para que pueda prepararse?\n\n🕘 Tu agente atiende de *L-V de 9h a 20:30h*\n\n⚠️ *Solo texto, no se admiten mensajes de voz.*",
    };

    if (menus[texto]) {
      await enviarMensaje(telefono, menus[texto]);
      return;
    }

    // FIX 4: FAQ PRIMERO, IA después (según instrucciones: IA es último recurso)
    const respuestaFAQ = buscarRespuestaFAQ(texto);
    if (respuestaFAQ) {
      await enviarMensaje(telefono, respuestaFAQ);
      return;
    }

    // ── IA: CONSULTAS COMPLEJAS SOBRE PRODUCTOS (último recurso) ──
    limpiarContextosAntiguos();
    const contextoCliente = obtenerContextoConversacion(telefono);

    // FIX 5: detectarProducto del módulo devuelve productId (string), no objeto
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
      `Gracias por tu mensaje. 😊\n\n` +
      `Para darte la mejor atención, elige una opción:\n\n` +
      `1️⃣ Información sobre seguros\n2️⃣ Solicitar cotización\n3️⃣ Realizar un pago\n4️⃣ Hablar con el agente\n5️⃣ Reportar un siniestro`
    );

  } catch (error) {
    console.error("❌ Error en webhook:", error);
  }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "✅ Bot Generali Seguros activo",
    modo: "🟢 24/7 activo",
    ia: ANTHROPIC_API_KEY ? `✅ Claude AI (${ANTHROPIC_MODEL})` : "⚠️ ANTHROPIC_API_KEY no configurada",
    productos_cargados: Object.keys(PRODUCTS_DATA).length,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot Generali Seguros corriendo en puerto ${PORT}`));
