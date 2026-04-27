const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ─── CONFIGURACIÓN ───────────────────────────────────────────
const VERIFY_TOKEN = "generali_bot_2024";
const PHONE_NUMBER_ID = "1106734449185257";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Horario de atención (hora España peninsular)
const HORARIO_INICIO = 9;
const HORARIO_FIN_HORA = 20;
const HORARIO_FIN_MINUTO = 30;
const DIAS_LABORABLES = [1, 2, 3, 4, 5]; // Lunes a viernes

// ─── PERSONALIDAD E INSTRUCCIONES DEL BOT ────────────────────
const SYSTEM_PROMPT = `
Eres el asistente virtual de un agente comercial de Generali Seguros en España.
Responde siempre en español, de forma amable, profesional y concisa (máximo 3 párrafos cortos).
Usa un tono cercano pero profesional, apropiado para una aseguradora de confianza.

Información que puedes proporcionar:
- Generali ofrece seguros de vida, hogar, auto, salud, empresas y ahorro/inversión.
- Para contratar o recibir una cotización personalizada, el agente les contactará directamente.
- En caso de siniestro urgente, el teléfono de atención de Generali es el 911 123 443 (24h gratuito).
- El agente está disponible de lunes a viernes de 9h a 18h.
- Generali es una de las aseguradoras más grandes del mundo, con más de 190 años de historia.

Reglas importantes:
- NUNCA inventes precios, coberturas específicas ni condiciones contractuales.
- Si no sabes algo con certeza, di que lo consultarás con el agente.
- Si el usuario quiere una cotización, recoge: nombre, tipo de seguro y teléfono de contacto.
- Si el usuario quiere hablar con el agente, dile que le avisarás y que contactará pronto.
- Usa emojis con moderación para hacer los mensajes más amigables.
`;

// ─── ESTADO DE CONVERSACIONES EN MEMORIA ─────────────────────
const conversaciones = new Map();

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

async function responderConIA(telefono, mensajeUsuario) {
  const historial = conversaciones.get(telefono) || [];
  historial.push({ role: "user", content: mensajeUsuario });

  // Mantener solo los últimos 10 mensajes
  const historialReciente = historial.slice(-10);

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: historialReciente,
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    const respuesta = response.data.content[0].text;
    historial.push({ role: "assistant", content: respuesta });
    conversaciones.set(telefono, historial);
    return respuesta;

  } catch (error) {
    console.error("❌ Error con IA:", error.response?.data || error.message);
    return "Lo siento, en este momento no puedo procesar tu consulta. Por favor, llama al *911 123 443* o vuelve a intentarlo en unos minutos.";
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
    console.log("❌ Verificación de webhook fallida");
    res.sendStatus(403);
  }
});

// ─── WEBHOOK: RECEPCIÓN DE MENSAJES ──────────────────────────
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Responder a Meta inmediatamente

  try {
    const mensaje = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!mensaje) return;

    const telefono = mensaje.from;
    const tipo = mensaje.type;

    console.log(`📩 Mensaje de ${telefono} [${tipo}]`);

    // Solo texto por ahora
    if (tipo !== "text") {
      await enviarMensaje(telefono, "Solo puedo procesar mensajes de texto por el momento. Escríbeme tu consulta. 😊");
      return;
    }

    const texto = mensaje.text.body.trim();
    const esNuevo = !conversaciones.has(telefono);

    // ── BIENVENIDA (primer mensaje) ──
    if (esNuevo) {
      conversaciones.set(telefono, []);

      if (!estaEnHorario()) {
        await enviarMensaje(telefono,
          `👋 ¡Hola! Bienvenido/a al asistente de *Generali Seguros*.\n\n` +
          `Ahora mismo estamos fuera de horario de atención _(L-V, 9h-20:30h)_.\n\n` +
          `Escríbeme tu consulta y tu agente te responderá en cuanto abramos. ¿En qué podemos ayudarte?\n\n` +
          `🆘 Para siniestros urgentes: *911 123 443* (24h, gratuito)`
        );
        return;
      }

      await enviarMensaje(telefono,
        `👋 ¡Hola! Bienvenido/a al asistente de tu agente de *Generali Seguros*.\n\n` +
        `Estoy aquí para ayudarte con cualquier consulta sobre seguros. ¿Cómo puedo ayudarte?\n\n` +
        `Puedes escribirme directamente o elegir una opción:\n\n` +
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
      "2": "¡Claro, con mucho gusto! 📋\n\nPara prepararte una cotización personalizada necesito saber:\n\n• ¿Qué tipo de seguro te interesa?\n• ¿Tu nombre?\n• ¿Un teléfono de contacto?\n\nCon esos datos tu agente te llamará lo antes posible.",
      "3": "Perfecto, voy a avisar a tu agente ahora mismo. ⏳\n\n¿Puedes indicarme tu *nombre* y el *motivo* de la consulta para que pueda prepararse?",
      "4": `🆘 *Para reportar un siniestro llama a:*\n\n📞 *911 123 443*\n_(gratuito · disponible 24 horas · todos los días)_\n\nNuestro equipo de siniestros te atenderá de inmediato. ¿Necesitas algo más?`,
    };

    if (menus[texto]) {
      await enviarMensaje(telefono, menus[texto]);
      return;
    }

    // ── FUERA DE HORARIO (usuarios recurrentes) ──
    if (!estaEnHorario()) {
      await enviarMensaje(telefono,
        `⏰ Ahora estamos fuera de horario _(L-V, 9h-20:30h)_.\n\n` +
        `He registrado tu consulta y tu agente te responderá en cuanto abramos. 📝\n\n` +
        `🆘 Para urgencias: *911 123 443* (24h)`
      );
      return;
    }

    // ── RESPUESTA CON IA ──
    const respuesta = await responderConIA(telefono, texto);
    await enviarMensaje(telefono, respuesta);

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
