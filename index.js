const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ─── CONFIGURACIÓN ───────────────────────────────────────────
const VERIFY_TOKEN = "generali_bot_2024";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// Bot funciona 24/7
const HORARIO_INICIO = 0;
const HORARIO_FIN_HORA = 23;
const HORARIO_FIN_MINUTO = 59;
const DIAS_LABORABLES = [0, 1, 2, 3, 4, 5, 6];

// ─── RESPUESTAS PREDEFINIDAS POR PALABRAS CLAVE ──────────────
const RESPUESTAS_FAQ = [
  {
    palabras: ["hogar", "casa", "vivienda", "piso", "apartamento"],
    respuesta: "🏠 *Seguro de Hogar Generali*\n\nNuestro seguro de hogar cubre daños por agua, incendio, robo, responsabilidad civil y mucho más.\n\nPara prepararte una cotización personalizada necesito:\n\n👤 Nombre completo\n🪪 DNI\n🎂 Fecha de nacimiento\n📍 Dirección completa\n📐 Metros cuadrados\n🏘️ ¿Piso o casa?\n\nEnvíame estos datos y tu agente te preparará la mejor oferta. 😊"
  },
  {
    palabras: ["auto", "coche", "carro", "vehículo", "vehiculo", "moto", "automóvil", "automovil"],
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
    palabras: ["empresa", "negocio", "pyme", "comercio", "local", "oficina", "autonomo", "autónomo"],
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
    palabras: ["siniestro", "accidente", "daño", "urgente", "emergencia", "robo"],
    respuesta: "🆘 *Reportar un siniestro*\n\nPara siniestros urgentes llama inmediatamente a:\n\n📞 *911 123 443*\n_(gratuito · 24 horas · todos los días)_\n\nSi prefieres que lo gestione yo, necesito:\n👤 Nombre completo\n🪪 DNI\n📍 Dirección\n📋 Descripción del siniestro\n\n💪 Dímelo y lo tramitamos juntos."
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

// ─── ESTADO DE CONVERSACIONES ────────────────────────────────
const conversaciones = new Set();

// ─── UTILIDADES ──────────────────────────────────────────────
function estaEnHorario() {
  const horaES = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const hora = horaES.getHours();
  const minuto = horaES.getMinutes();
  const dia = horaES.getDay();
  const totalMinutos = hora * 60 + minuto;
  const inicioMinutos = HORARIO_INICIO * 60;
  const finMinutos = HORARIO_FIN_HORA * 60 + HORARIO_FIN_MINUTO;
  return DIAS_LABORABLES.includes(dia) && totalMinutos >= inicioMinutos && totalMinutos <= finMinutos;
}

function buscarRespuestaFAQ(texto) {
  const textoNorm = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const faq of RESPUESTAS_FAQ) {
    if (faq.palabras.some(p => textoNorm.includes(p))) {
      return faq.respuesta;
    }
  }
  return null;
}

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

    if (tipo !== "text") {
      await enviarMensaje(telefono, "Solo puedo procesar mensajes de texto por el momento. Escríbeme tu consulta. 😊");
      return;
    }

    const texto = mensaje.text.body.trim();
    const esNuevo = !conversaciones.has(telefono);
    console.log(`📩 [${telefono}] ${texto}`);

    // ── BIENVENIDA ──
    if (esNuevo) {
      conversaciones.add(telefono);
      await enviarMensaje(telefono,
        `👋 ¡Hola! Bienvenido/a al asistente de tu agente de *Generali Seguros*.\n\n` +
        `Estoy aquí para ayudarte 24/7. Tu agente atiende personalmente de *L-V de 9h a 20:30h*.\n\n` +
        `¿Cómo puedo ayudarte?\n\n` +
        `1️⃣ Información sobre seguros\n` +
        `2️⃣ Solicitar cotización\n` +
        `3️⃣ Hablar con el agente\n` +
        `4️⃣ Reportar un siniestro`
      );
      return;
    }

    // ── MENÚ RÁPIDO ──
    const menus = {
      "1": "¿Sobre qué tipo de seguro necesitas información?\n\n🏠 *Hogar* · 🚗 *Auto* · ❤️ *Vida* · 🏥 *Salud* · 🦷 *Dental* · 🏢 *Empresas* · 💰 *Ahorro*\n\nEscríbeme el que te interese y te cuento todo.",
      "2": "📋 *Solicitar cotización*\n\nDime qué tipo de seguro te interesa y te indico exactamente qué documentación necesitamos:\n\n🏠 Hogar · 🚗 Auto · ❤️ Vida · 🏥 Salud · 🏢 Empresas · 💰 Ahorro",
      "3": "Perfecto, voy a avisar a tu agente ahora mismo. ⏳\n\n¿Puedes indicarme tu *nombre* y el *motivo* de la consulta para que pueda prepararse?\n\n🕘 Tu agente atiende de *L-V de 9h a 20:30h*",
      "4": "🆘 *Para reportar un siniestro llama a:*\n\n📞 *911 123 443*\n_(gratuito · disponible 24 horas · todos los días)_\n\nNuestro equipo de siniestros te atenderá de inmediato.",
    };

    if (menus[texto]) {
      await enviarMensaje(telefono, menus[texto]);
      return;
    }

    // ── BÚSQUEDA POR PALABRAS CLAVE ──
    const respuestaFAQ = buscarRespuestaFAQ(texto);
    if (respuestaFAQ) {
      await enviarMensaje(telefono, respuestaFAQ);
      return;
    }

    // ── RESPUESTA GENÉRICA ──
    await enviarMensaje(telefono,
      `Gracias por tu mensaje. 😊\n\n` +
      `Para darte la mejor atención, elige una opción:\n\n` +
      `1️⃣ Información sobre seguros\n` +
      `2️⃣ Solicitar cotización\n` +
      `3️⃣ Hablar con el agente\n` +
      `4️⃣ Reportar un siniestro`
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
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot Generali Seguros corriendo en puerto ${PORT}`));
