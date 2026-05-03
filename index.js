const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ─── CONFIGURACIÓN ───────────────────────────────────────────
const VERIFY_TOKEN = "generali_bot_2024";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// Horario de atención (hora España peninsular)
const HORARIO_INICIO = 9;
const HORARIO_FIN_HORA = 20;
const HORARIO_FIN_MINUTO = 30;
const DIAS_LABORABLES = [1, 2, 3, 4, 5]; // Lunes a viernes

// ─── RESPUESTAS PREDEFINIDAS POR PALABRAS CLAVE ──────────────
const RESPUESTAS_FAQ = [
  {
    palabras: ["hogar", "casa", "vivienda", "piso", "apartamento"],
    respuesta: "🏠 *Seguro de Hogar Generali*\n\nNuestro seguro de hogar cubre daños por agua, incendio, robo, responsabilidad civil y mucho más.\n\nPara una cotización personalizada dime tu nombre y teléfono y tu agente te contactará enseguida. 😊"
  },
  {
    palabras: ["auto", "coche", "carro", "vehículo", "moto", "automóvil"],
    respuesta: "🚗 *Seguro de Auto Generali*\n\nOfrecemos coberturas a terceros, todo riesgo y modalidades intermedias adaptadas a tu perfil.\n\nPara una cotización personalizada dime tu nombre y teléfono y tu agente te contactará enseguida. 😊"
  },
  {
    palabras: ["vida", "fallecimiento", "muerte", "deceso", "supervivencia"],
    respuesta: "❤️ *Seguro de Vida Generali*\n\nProtege a tu familia con nuestros seguros de vida. Disponemos de distintas modalidades según tus necesidades y presupuesto.\n\nPara una cotización personalizada dime tu nombre y teléfono y tu agente te contactará enseguida. 😊"
  },
  {
    palabras: ["salud", "médico", "médica", "sanitario", "hospital", "dental"],
    respuesta: "🏥 *Seguro de Salud Generali*\n\nAccede a los mejores especialistas sin listas de espera. Incluye cobertura dental, hospitalización y mucho más.\n\nPara una cotización personalizada dime tu nombre y teléfono y tu agente te contactará enseguida. 😊"
  },
  {
    palabras: ["empresa", "negocio", "pyme", "comercio", "local", "oficina"],
    respuesta: "🏢 *Seguro de Empresas Generali*\n\nProtege tu negocio con coberturas adaptadas: responsabilidad civil, daños materiales, pérdida de beneficios y más.\n\nPara una cotización personalizada dime tu nombre y teléfono y tu agente te contactará enseguida. 😊"
  },
  {
    palabras: ["ahorro", "inversión", "plan", "jubilación", "pensión", "futuro"],
    respuesta: "💰 *Seguros de Ahorro e Inversión Generali*\n\nPlanifica tu futuro con nuestros productos de ahorro y jubilación, con rentabilidad garantizada y ventajas fiscales.\n\nPara una cotización personalizada dime tu nombre y teléfono y tu agente te contactará enseguida. 😊"
  },
  {
    palabras: ["precio", "coste", "costo", "cuánto", "cuanto", "presupuesto", "cotización", "cotizacion"],
    respuesta: "📋 *Solicitar cotización*\n\nCon mucho gusto preparamos un presupuesto personalizado para ti.\n\nPor favor dime:\n• ¿Qué tipo de seguro te interesa?\n• Tu nombre\n• Tu teléfono de contacto\n\nTu agente te llamará lo antes posible. 😊"
  },
  {
    palabras: ["siniestro", "accidente", "daño", "urgente", "emergencia", "robo"],
    respuesta: "🆘 *Reportar un siniestro*\n\nPara siniestros urgentes llama inmediatamente a:\n\n📞 *911 123 443*\n_(gratuito · 24 horas · todos los días)_\n\nNuestro equipo te atenderá de inmediato."
  },
  {
    palabras: ["horario", "hora", "cuando", "cuándo", "disponible", "atención", "atencion"],
    respuesta: "🕘 *Horario de atención*\n\nEstamos disponibles:\n📅 Lunes a Viernes\n⏰ 9:00h a 20:30h\n\nFuera de este horario puedes dejarnos tu mensaje y te responderemos en cuanto abramos. 😊"
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

      if (!estaEnHorario()) {
        await enviarMensaje(telefono,
          `👋 ¡Hola! Bienvenido/a al asistente de *Generali Seguros*.\n\n` +
          `Ahora mismo estamos fuera de horario _(L-V, 9h-20:30h)_.\n\n` +
          `Escríbeme tu consulta y tu agente te responderá en cuanto abramos. 📝\n\n` +
          `🆘 Para siniestros urgentes: *911 123 443* (24h)`
        );
        return;
      }

      await enviarMensaje(telefono,
        `👋 ¡Hola! Bienvenido/a al asistente de tu agente de *Generali Seguros*.\n\n` +
        `Estoy aquí para ayudarte con cualquier consulta. ¿Cómo puedo ayudarte?\n\n` +
        `1️⃣ Información sobre seguros\n` +
        `2️⃣ Solicitar cotización\n` +
        `3️⃣ Hablar con el agente\n` +
        `4️⃣ Reportar un siniestro`
      );
      return;
    }

    // ── MENÚ RÁPIDO ──
    const menus = {
      "1": "¿Sobre qué tipo de seguro necesitas información?\n\n🏠 *Hogar* · 🚗 *Auto* · ❤️ *Vida* · 🏥 *Salud* · 🏢 *Empresas* · 💰 *Ahorro*\n\nEscríbeme el que te interese y te cuento todo.",
      "2": "📋 *Solicitar cotización*\n\nCon mucho gusto preparamos un presupuesto personalizado.\n\nPor favor dime:\n• ¿Qué tipo de seguro te interesa?\n• Tu nombre\n• Tu teléfono de contacto\n\nTu agente te llamará lo antes posible. 😊",
      "3": "Perfecto, voy a avisar a tu agente ahora mismo. ⏳\n\n¿Puedes indicarme tu *nombre* y el *motivo* de la consulta para que pueda prepararse?",
      "4": "🆘 *Para reportar un siniestro llama a:*\n\n📞 *911 123 443*\n_(gratuito · disponible 24 horas · todos los días)_\n\nNuestro equipo de siniestros te atenderá de inmediato.",
    };

    if (menus[texto]) {
      await enviarMensaje(telefono, menus[texto]);
      return;
    }

    // ── FUERA DE HORARIO ──
    if (!estaEnHorario()) {
      await enviarMensaje(telefono,
        `⏰ Ahora estamos fuera de horario _(L-V, 9h-20:30h)_.\n\n` +
        `He registrado tu consulta y tu agente te responderá en cuanto abramos. 📝\n\n` +
        `🆘 Para urgencias: *911 123 443* (24h)`
      );
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
    horario: estaEnHorario() ? "🟢 Dentro de horario" : "🔴 Fuera de horario",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot Generali Seguros corriendo en puerto ${PORT}`));
