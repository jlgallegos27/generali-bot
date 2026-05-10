/**
 * productsData.optimizado.js
 * Base de conocimiento compacta para IA conversacional del bot WhatsApp Generali.
 *
 * Objetivo:
 * - Reducir coste de tokens frente a enviar condicionados completos.
 * - Evitar respuestas inventadas.
 * - Cargar solo el producto relevante según intención/palabras clave.
 *
 * Regla general para la IA:
 * Nunca confirmar coberturas como definitivas sin revisar póliza, modalidad contratada
 * y condiciones particulares. Si hay duda, derivar al agente.
 */

const PRODUCTS_DATA = {
  hogar: {
    nombre: "GENERALI HOGAR",
    categoria: "Hogar",
    keywords: ["hogar", "casa", "vivienda", "piso", "apartamento", "agua", "fuga", "robo casa", "incendio", "cristal", "fontanero", "continente", "contenido"],
    descripcion: "Seguro multirriesgo para vivienda principal o secundaria, orientado a proteger continente, contenido, responsabilidad civil y servicios de asistencia en el hogar.",
    coberturas_principales: [
      "Incendio, explosión, implosión y caída de rayo hasta el 100% de continente y contenido.",
      "Daños por humo, impactos desde el exterior y derrame o escape de instalaciones de extinción.",
      "Fenómenos meteorológicos: lluvia, viento, pedrisco, nieve, goteras, filtraciones e inundación, según condiciones.",
      "Daños por agua: escapes, localización y reparación, con fontanería urgente sin daños hasta 200€.",
      "Roturas: cristales, lunas, espejos, loza sanitaria y fregaderos.",
      "Robo en vivienda, robo de mobiliario y enseres, joyas con límites específicos, y actos de vandalismo.",
      "Daños consecuenciales: demolición, salvamento, alquiler provisional y hotel con límites.",
      "Responsabilidad civil de la vivienda y defensa jurídica."
    ],
    limites_clave: [
      "Daños eléctricos básicos: 500€, salvo ampliaciones.",
      "Alimentos refrigerados: 1% con máximo 1.000€.",
      "Alquiler de vivienda provisional: 25%, máximo 2 años.",
      "Hotel: 5%, máximo 3.000€.",
      "RC vivienda: capital contratado, con máximo orientativo de 300.000€ por víctima según condicionado.",
      "Defensa jurídica: 6.000€."
    ],
    ampliaciones: [
      "Hogar Confortable: puede ampliar daños por helada hasta 3.000€ y daños eléctricos hasta 100%.",
      "Hogar Exclusivo: puede incluir exceso de consumo de agua hasta 1.000€ y restauración estética de mobiliario hasta 3.000€.",
      "Todo Riesgo Accidental: cobertura adicional según modalidad contratada."
    ],
    exclusiones_o_precauciones: [
      "La cobertura exacta depende de modalidad, capitales contratados, franquicias y condiciones particulares.",
      "En daños por agua conviene revisar origen del escape, mantenimiento y si existen daños cubiertos.",
      "En robo suele ser importante acreditar denuncia y circunstancias del hecho.",
      "No confirmar límites o indemnización sin revisar póliza concreta."
    ],
    respuesta_segura: "Puedo orientarte según el condicionado general, pero la cobertura definitiva depende de tu póliza y condiciones particulares. Si me das el caso concreto, lo revisa tu agente."
  },

  autos: {
    nombre: "GENERALI AUTOS",
    categoria: "Vehículos",
    keywords: ["auto", "autos", "coche", "vehiculo", "vehículo", "turismo", "matricula", "matrícula", "lunas", "robo coche", "incendio coche", "asistencia carretera", "todo riesgo", "franquicia"],
    descripcion: "Seguro para automóviles con responsabilidad civil obligatoria, coberturas voluntarias y garantías adicionales según modalidad contratada.",
    coberturas_principales: [
      "Responsabilidad Civil Obligatoria: daños a terceros dentro de límites legales.",
      "Responsabilidad Civil Voluntaria Limitada, Ampliación RC y RC Plus, según contratación.",
      "Defensa jurídica y reclamación de daños, con posible ampliación.",
      "Accidentes corporales y ampliación de accidentes corporales.",
      "Asistencia en viaje: remolque, repatriación y alojamiento en determinados supuestos.",
      "Rotura de lunas.",
      "Incendio, explosión y rayo del vehículo.",
      "Robo o apropiación ilegal del vehículo.",
      "Fenómenos de la naturaleza, pérdida total, daños propios, colisión con animales, vehículo de sustitución, retirada del permiso e indemnización por paralización, si están contratadas."
    ],
    limites_clave: [
      "La RC obligatoria se ajusta a límites legales.",
      "Daños propios pueden contratarse a todo riesgo o con franquicia.",
      "Vehículo de sustitución, paralización y retirada de permiso dependen de modalidad y límites contratados."
    ],
    exclusiones_o_precauciones: [
      "No asegurar al cliente que una cobertura está incluida sin ver la modalidad contratada.",
      "En siniestros de auto pedir parte amistoso o datos del contrario, fotos de daños, matrícula, compañía y póliza si procede.",
      "En urgencia o riesgo inmediato, derivar al teléfono de asistencia/siniestros indicado por el agente."
    ],
    respuesta_segura: "En auto depende mucho de la modalidad contratada: terceros, ampliado, todo riesgo o franquicia. Te oriento, pero el agente debe comprobar la póliza."
  },

  motor: {
    nombre: "GENERALI MOTOR",
    categoria: "Vehículos industriales y motor",
    keywords: ["motor", "camion", "camión", "tractocamion", "tractocamión", "furgoneta", "remolque", "vehiculo industrial", "mercancia", "mercancía", "transportista", "carga"],
    descripcion: "Producto para vehículos de motor incluyendo turismos, motocicletas, ciclomotores, furgonetas, camiones, tractocamiones y remolques.",
    coberturas_principales: [
      "RC Obligatoria y RC Voluntaria Limitada.",
      "Ampliación RC y RC Plus.",
      "Defensa jurídica, reclamación de daños, accidentes corporales, segunda opinión médica y hospitalización.",
      "Asistencia en viaje para turismos, motos, furgonetas, camiones y tractocamiones según anexos.",
      "Lunas, incendio, robo, pérdida total, daños del vehículo, colisión con animales, vehículo de sustitución, retirada de permiso y paralización.",
      "Coberturas específicas para vehículos industriales: RC de la Carga, RC del Transportista, RC de Trabajos y seguro de mercancía transportada."
    ],
    limites_clave: [
      "Las garantías industriales dependen de actividad, vehículo, uso y modalidad contratada.",
      "Asistencia varía según tipo de vehículo y anexo aplicable."
    ],
    exclusiones_o_precauciones: [
      "Diferenciar bien entre seguro de vehículo, responsabilidad del transportista y mercancía transportada.",
      "No confirmar cobertura de carga o mercancías sin revisar contratación específica."
    ],
    respuesta_segura: "Para vehículos industriales hay que revisar uso, actividad, tipo de carga y garantías contratadas. Te puedo orientar, pero el agente debe revisar la póliza."
  },

  motos: {
    nombre: "GENERALI MOTOS",
    categoria: "Motos",
    keywords: ["moto", "motocicleta", "ciclomotor", "scooter", "125", "casco", "robo moto", "accidente moto"],
    descripcion: "Producto específico para motocicletas y ciclomotores.",
    coberturas_principales: [
      "RC Obligatoria para daños a terceros en España y UE.",
      "RC Voluntaria Limitada, Ampliación RC y RC Plus.",
      "Defensa jurídica, reclamación de daños y posible ampliación.",
      "Accidentes corporales y ampliación de accidentes corporales.",
      "Indemnización por hospitalización.",
      "Asistencia en viaje.",
      "Incendio, robo o apropiación ilegal, pérdida total, daños del vehículo y retirada del permiso."
    ],
    limites_clave: [
      "No incluye como garantías separadas vehículo de sustitución, segunda opinión médica ni fenómenos de la naturaleza, según el resumen disponible.",
      "Daños propios y pérdida total dependen de contratación."
    ],
    exclusiones_o_precauciones: [
      "No confirmar coberturas como vehículo de sustitución salvo revisión de póliza.",
      "En siniestro pedir fotos, parte, matrícula y datos del contrario."
    ],
    respuesta_segura: "En motos la cobertura exacta depende de si se contrató solo RC, ampliado, robo/incendio o daños. Lo revisa tu agente con la póliza."
  },

  mi_empresa: {
    nombre: "GENERALI MI EMPRESA",
    categoria: "Empresa",
    keywords: ["empresa", "pyme", "comercio", "negocio", "local", "empleados", "responsabilidad civil empresa", "maquinaria", "perdida beneficios", "pérdida beneficios"],
    descripcion: "Seguro multirriesgo para empresas y comercios, con módulos de daños materiales, averías, transporte, pérdida de beneficios, RC y servicios transversales.",
    coberturas_principales: [
      "Daños materiales propios: incendio, explosión, rayo, humo, fenómenos atmosféricos, daños por agua y roturas.",
      "Averías: daños eléctricos en ajuar, averías de maquinaria, rotura de cadena de frío y derrame de líquidos.",
      "Transporte de mercancías: daños materiales y RC del transportista.",
      "Pérdida de beneficios: interrupción de negocio y gastos fijos.",
      "Responsabilidad Civil: explotación, inmobiliaria, patronal, productos/post-trabajos, objetos confiados, contaminación accidental y medioambiental.",
      "Accidentes corporales de empleados.",
      "Defensa jurídica, servicios a la empresa, asistencia tecnológica, asesoría y honorarios profesionales externos."
    ],
    limites_clave: [
      "El producto es modular: hay que confirmar qué módulos y capitales están contratados.",
      "Existen módulos sectoriales para agricultura, ganadería, hostelería, farmacias, restauración y cultura."
    ],
    exclusiones_o_precauciones: [
      "No confirmar pérdida de beneficios, RC patronal o mercancías sin revisar módulo contratado.",
      "En empresas es clave conocer actividad, ubicación, empleados, facturación y capitales asegurados."
    ],
    respuesta_segura: "En empresas hay que revisar módulos contratados, actividad y capitales. Puedo orientarte, pero la respuesta final debe validarla el agente."
  },

  negocio: {
    nombre: "GENERALI NEGOCIO",
    categoria: "Negocio/local",
    keywords: ["negocio", "local", "tienda", "bar", "restaurante", "comercio", "caja fuerte", "mercancias", "mercancías", "camara frigorifica", "cámara frigorífica"],
    descripcion: "Seguro multirriesgo para pequeños negocios y locales comerciales.",
    coberturas_principales: [
      "Incendio, explosión, implosión, rayo, humo, impactos y daños eléctricos.",
      "Fenómenos meteorológicos, goteras, filtraciones e inundación.",
      "Daños por agua: escapes, localización, reparación y fontanería urgente hasta 200€.",
      "Roturas: cristales, rótulos, metacrilatos, loza, encimeras y placas solares.",
      "Robo y vandalismo en continente, contenido y mercancías.",
      "Daños consecuenciales: demolición, salvamento, alquiler de local provisional, pérdida de alquileres y restauración estética.",
      "Garantías especiales: transporte de mercancías, avería de maquinaria/equipos electrónicos y mercancías en cámaras frigoríficas.",
      "Pérdida de explotación, RC del negocio, defensa jurídica y asistencia."
    ],
    limites_clave: [
      "Alquiler de local provisional: 20%, máximo 1 año.",
      "Pérdida de alquileres: 20%, máximo 1 año.",
      "Indemnización diaria por pérdida de explotación: máximo 90 días, según contratación.",
      "RC negocio: capital contratado, con máximo orientativo 150.000€ por víctima.",
      "Defensa jurídica incluida: 6.000€."
    ],
    ampliaciones: [
      "Ampliación Negocio Exclusivo: daños por helada hasta 2.000€, otras roturas hasta 1.000€, todo riesgo accidental, dinero en caja fuerte e infidelidad de empleados."
    ],
    exclusiones_o_precauciones: [
      "La pérdida de explotación debe estar contratada y se aplican límites.",
      "Mercancías refrigeradas, caja fuerte e infidelidad de empleados requieren revisar condiciones."
    ],
    respuesta_segura: "Para negocios hay que revisar actividad, capitales, garantías especiales y ampliaciones contratadas antes de confirmar cobertura."
  },

  comunidad: {
    nombre: "GENERALI COMUNIDAD",
    categoria: "Comunidades",
    keywords: ["comunidad", "edificio", "presidente", "administrador", "zonas comunes", "vecinos", "desatasco", "malversacion", "malversación", "ascensor"],
    descripcion: "Seguro para comunidades de propietarios y edificios, centrado en daños del edificio, zonas comunes, RC y servicios comunitarios.",
    coberturas_principales: [
      "Incendio, explosión, rayo, humo, impactos exteriores, daños eléctricos, fenómenos meteorológicos, inundación y ruina total por obras de terceros.",
      "Zonas comunes: escapes de agua, localización, reparación, fontanería urgente, desatasco, cristales, robo de continente común, hurto, malversación de fondos y vandalismo.",
      "Daños consecuenciales: demolición, salvamento, alquiler provisional, hotel, pérdida de alquileres y restauración estética.",
      "RC de la comunidad, defensa jurídica y servicios/asistencia comunitaria."
    ],
    limites_clave: [
      "Reparación por escapes en zonas comunes: 1.500€ según resumen.",
      "Fontanería urgente: 250€/año.",
      "Desatasco: límite contratado, 500€/acción.",
      "Hurto: 200€.",
      "Malversación de fondos comunitarios: 3.000€.",
      "Hotel: 300€/día/vivienda, máximo 10 días, según resumen."
    ],
    exclusiones_o_precauciones: [
      "Diferenciar daños comunitarios de daños privativos de cada vivienda.",
      "Confirmar siempre capitales, límites y si la comunidad tiene contratadas ampliaciones."
    ],
    respuesta_segura: "En comunidades es clave saber si el daño afecta a elemento común o privativo. La póliza y los capitales contratados determinan la cobertura final."
  },

  vida_riesgo: {
    nombre: "GENERALI VIDA RIESGO",
    categoria: "Vida",
    keywords: ["vida riesgo", "seguro de vida", "fallecimiento", "invalidez", "incapacidad", "hipoteca", "capital vida", "beneficiario", "enfermedad grave"],
    descripcion: "Seguro de vida riesgo destinado a proteger económicamente a beneficiarios en caso de fallecimiento y, si se contrata, invalidez u otras garantías complementarias.",
    coberturas_principales: [
      "Fallecimiento por cualquier causa, con capital asegurado para beneficiarios.",
      "Posibles garantías complementarias: invalidez absoluta y permanente, fallecimiento por accidente, doble capital por accidente de circulación y enfermedades graves, según contratación.",
      "Puede vincularse a protección familiar, préstamo o hipoteca."
    ],
    limites_clave: [
      "El capital asegurado y beneficiarios se determinan en condiciones particulares.",
      "Puede requerir cuestionario de salud o pruebas médicas según capital y edad."
    ],
    exclusiones_o_precauciones: [
      "No prometer aceptación: depende de edad, salud, capital y declaración de riesgo.",
      "No confirmar coberturas complementarias sin póliza."
    ],
    respuesta_segura: "En vida hay que revisar capital, beneficiarios, edad, salud y garantías complementarias. Te oriento, pero el agente debe validar la opción."
  },

  salud_premium: {
    nombre: "GENERALI SALUD PREMIUM",
    categoria: "Salud",
    keywords: ["salud premium", "salud", "medico", "médico", "hospital", "especialista", "maternidad", "embarazo", "parto", "copago", "sin copago", "cuadro medico", "cuadro médico"],
    descripcion: "Seguro de salud completo con asistencia sanitaria, especialistas, pruebas, hospitalización y servicios médicos según modalidad.",
    coberturas_principales: [
      "Medicina primaria y especialistas.",
      "Pruebas diagnósticas y métodos terapéuticos según cuadro médico y condiciones.",
      "Hospitalización e intervenciones quirúrgicas según modalidad.",
      "Asistencia en embarazo, parto y pediatría si está incluida y superadas carencias.",
      "Acceso a cuadro médico y servicios concertados."
    ],
    limites_clave: [
      "Puede existir carencia para parto, hospitalización, pruebas especiales u otras garantías.",
      "Puede tener modalidad con o sin copago, según contratación.",
      "Las preexistencias deben declararse y pueden quedar excluidas o condicionadas."
    ],
    exclusiones_o_precauciones: [
      "No confirmar maternidad, cirugía o prueba concreta sin revisar carencias y condiciones particulares.",
      "En salud es crítico preguntar fecha de alta, preexistencias y modalidad contratada.",
      "Derivar al agente si el cliente pregunta por cobertura médica concreta o autorización."
    ],
    respuesta_segura: "En salud hay que revisar modalidad, carencias y preexistencias. Te oriento, pero para confirmar cobertura concreta debe revisarlo tu agente."
  },

  salud_single: {
    nombre: "GENERALI SALUD SINGLE",
    categoria: "Salud",
    keywords: ["salud single", "single", "seguro salud individual", "salud individual", "joven", "solo para mi", "solo para mí"],
    descripcion: "Modalidad de salud orientada a asegurados individuales, con asistencia médica y especialistas según condiciones contratadas.",
    coberturas_principales: [
      "Acceso a servicios médicos y especialistas según cuadro médico.",
      "Pruebas diagnósticas y asistencia ambulatoria según modalidad.",
      "Puede estar orientado a personas que buscan una solución individual más ajustada."
    ],
    limites_clave: [
      "Revisar copagos, carencias y cuadro médico.",
      "Las coberturas exactas dependen de la modalidad contratada."
    ],
    exclusiones_o_precauciones: [
      "No equiparar automáticamente con Salud Premium.",
      "Confirmar siempre si incluye hospitalización, maternidad u otras garantías sensibles."
    ],
    respuesta_segura: "Salud Single puede ser una opción individual, pero hay que revisar modalidad, copagos y carencias antes de confirmar prestaciones."
  },

  salud_clinic: {
    nombre: "GENERALI SALUD CLINIC",
    categoria: "Salud",
    keywords: ["salud clinic", "clinic", "clinica", "clínica", "consulta medica", "consulta médica", "asistencia ambulatoria"],
    descripcion: "Modalidad de salud orientada a asistencia médica y acceso a servicios clínicos según cuadro médico y condiciones.",
    coberturas_principales: [
      "Consultas médicas y especialistas según cuadro médico.",
      "Pruebas diagnósticas y servicios clínicos incluidos en la modalidad.",
      "Puede estar más enfocada a asistencia ambulatoria que a coberturas hospitalarias completas."
    ],
    limites_clave: [
      "Confirmar si incluye hospitalización, cirugía, pruebas especiales y carencias.",
      "Puede existir copago o límites de uso según modalidad."
    ],
    exclusiones_o_precauciones: [
      "No prometer prestaciones hospitalarias si no están contratadas.",
      "Derivar al agente ante dudas de cobertura médica concreta."
    ],
    respuesta_segura: "Salud Clinic puede cubrir consultas y servicios médicos, pero hay que revisar modalidad para confirmar hospitalización, pruebas o tratamientos."
  },

  enfermedades_graves: {
    nombre: "GENERALI SALUD ENFERMEDADES GRAVES",
    categoria: "Salud",
    keywords: ["enfermedad grave", "enfermedades graves", "cancer", "cáncer", "infarto", "ictus", "segunda opinion", "segunda opinión", "diagnostico grave", "diagnóstico grave"],
    descripcion: "Producto orientado a apoyo económico o servicios ante diagnóstico de enfermedades graves definidas en la póliza.",
    coberturas_principales: [
      "Cobertura ante enfermedades graves definidas en contrato.",
      "Puede incluir segunda opinión médica y servicios de orientación sanitaria.",
      "Apoyo económico o prestación según capital y condiciones."
    ],
    limites_clave: [
      "Solo cubre enfermedades graves expresamente definidas.",
      "Puede haber periodos de carencia, supervivencia mínima o requisitos médicos.",
      "El capital y prestación dependen de condiciones particulares."
    ],
    exclusiones_o_precauciones: [
      "No afirmar que cualquier cáncer, infarto o ictus está cubierto sin revisar definición exacta.",
      "Preexistencias y diagnósticos previos pueden afectar."
    ],
    respuesta_segura: "En enfermedades graves la definición médica exacta es clave. Hay que revisar diagnóstico, fecha, carencias y condiciones particulares."
  },

  dental: {
    nombre: "GENERALI DENTAL",
    categoria: "Dental",
    keywords: ["dental", "dentista", "dientes", "ortodoncia", "empaste", "implante", "limpieza", "boca", "periodoncia"],
    descripcion: "Cobertura dental con acceso a red de dentistas y servicios incluidos o con precios franquiciados según tratamiento.",
    coberturas_principales: [
      "Servicios preventivos y consultas dentales según cuadro dental.",
      "Determinados actos pueden estar incluidos sin coste y otros con precios especiales/franquiciados.",
      "Puede incluir limpiezas, revisiones y tratamientos odontológicos según condiciones."
    ],
    limites_clave: [
      "Ortodoncia, implantes y tratamientos complejos suelen requerir revisar condiciones y tarifas.",
      "La red dental y precios pueden depender del prestador y zona."
    ],
    exclusiones_o_precauciones: [
      "No confirmar que un tratamiento concreto sea gratis sin revisar cuadro dental.",
      "Derivar al enlace/cuadro dental o al agente para tratamiento concreto."
    ],
    respuesta_segura: "En dental depende del tratamiento y del cuadro dental. Puedo orientarte, pero conviene revisar si está incluido o va con precio franquiciado."
  },

  profesional_baremado: {
    nombre: "GENERALI PROFESIONAL BAREMADO",
    categoria: "Profesionales",
    keywords: ["profesional baremado", "baja laboral", "autonomo", "autónomo", "incapacidad temporal", "baremo", "subsidio", "profesional"],
    descripcion: "Seguro para profesionales/autónomos que puede indemnizar situaciones de baja o incapacidad según baremo pactado.",
    coberturas_principales: [
      "Indemnización según baremo por determinadas situaciones de incapacidad temporal o accidente/enfermedad, según contrato.",
      "Orientado a cubrir pérdida de ingresos de profesionales durante baja.",
      "Puede incluir garantías adicionales según modalidad."
    ],
    limites_clave: [
      "La indemnización se calcula según baremo, no necesariamente por días reales completos.",
      "Actividad profesional, edad, capital diario y franquicias/carencias son determinantes."
    ],
    exclusiones_o_precauciones: [
      "No confirmar indemnización sin revisar diagnóstico, baremo y condiciones particulares.",
      "Declaración de actividad y salud puede afectar aceptación."
    ],
    respuesta_segura: "En profesional baremado hay que revisar actividad, diagnóstico y baremo. El agente debe calcular la indemnización aplicable."
  },

  profesional_plus: {
    nombre: "GENERALI PROFESIONAL PLUS",
    categoria: "Profesionales",
    keywords: ["profesional plus", "baja autonomo", "baja autónomo", "subsidio diario", "incapacidad temporal", "autonomos", "autónomos"],
    descripcion: "Seguro para profesionales orientado a proteger ingresos en casos de incapacidad temporal, accidente o enfermedad, según modalidad.",
    coberturas_principales: [
      "Subsidio o prestación por incapacidad temporal según contratación.",
      "Cobertura para profesionales y autónomos que necesitan proteger ingresos.",
      "Puede incluir garantías complementarias según condiciones."
    ],
    limites_clave: [
      "Revisar capital diario, franquicia, duración máxima, carencias y actividad profesional.",
      "La prestación depende de documentación médica y condiciones de póliza."
    ],
    exclusiones_o_precauciones: [
      "No prometer cobro por cualquier baja sin revisar exclusiones.",
      "Enfermedades previas y actividades de riesgo pueden afectar."
    ],
    respuesta_segura: "En Profesional Plus hay que revisar capital diario, baja, diagnóstico, franquicias y carencias. Lo confirma el agente."
  },

  proteccion_familiar: {
    nombre: "GENERALI PROTECCIÓN FAMILIAR",
    categoria: "Decesos/Protección familiar",
    keywords: ["proteccion familiar", "protección familiar", "decesos", "funeral", "sepelio", "entierro", "repatriacion", "repatriación", "fallecimiento familiar"],
    descripcion: "Seguro de protección familiar/decesos con prestación de servicio funerario y asistencias complementarias.",
    coberturas_principales: [
      "Servicio de decesos: organización del sepelio, ataúd, flores, esquelas, transporte y trámites administrativos.",
      "Asistencia por fallecimiento: gestión documental, asesoría legal sucesoria y apoyo psicológico.",
      "Capital adicional para gastos de sepelio, si está contratado.",
      "Asistencia familiar en vida: asistencia hogar, sanitaria 24h, orientación médica, enfermería, transporte sanitario, cuidado de hijos, ayuda a domicilio y asistencia en viaje.",
      "Fallecimiento o invalidez por accidente, hospitalización y repatriación nacional/internacional, si están contratadas.",
      "Gestión y gastos por fallecimiento de mascotas, si está incluido."
    ],
    limites_clave: [
      "Servicio completo de sepelio según condiciones, sin límite de capital en el resumen disponible.",
      "Puede existir revalorización automática anual.",
      "Personas asegurables hasta límites de edad establecidos."
    ],
    exclusiones_o_precauciones: [
      "Confirmar servicios concretos, capitales adicionales y repatriación según póliza.",
      "No prometer cobertura de mascota, hospitalización o asistencia familiar sin revisar modalidad."
    ],
    respuesta_segura: "Protección Familiar se centra en decesos y asistencia, pero cada servicio depende de modalidad y asegurados incluidos. Lo revisa el agente."
  },

  vida_facil: {
    nombre: "GENERALI VIDA FÁCIL",
    categoria: "Vida",
    keywords: ["vida facil", "vida fácil", "vida simplificada", "seguro vida facil", "sin reconocimiento medico", "sin reconocimiento médico"],
    descripcion: "Seguro de vida de suscripción simplificada para cubrir fallecimiento y posibles garantías complementarias.",
    coberturas_principales: [
      "Fallecimiento por cualquier causa, con pago de capital a beneficiarios.",
      "Opcionales: fallecimiento por accidente e invalidez absoluta y permanente.",
      "Puede incluir segunda opinión médica en enfermedad grave y acceso a servicios de bienestar y salud."
    ],
    limites_clave: [
      "Suscripción simplificada con pocas preguntas de salud.",
      "Sin reconocimiento médico para capitales hasta cierto límite, según condiciones.",
      "Duración anual con renovación automática.",
      "Ámbito territorial mundial, según resumen disponible."
    ],
    exclusiones_o_precauciones: [
      "No asegurar aceptación automática: depende de capital, edad y declaración de salud.",
      "Revisar beneficiarios, capital y garantías opcionales."
    ],
    respuesta_segura: "Vida Fácil simplifica la contratación, pero hay que revisar capital, edad, salud y garantías opcionales antes de confirmar."
  },

  index_100_2028: {
    nombre: "GENERALI INDEX 100 2028",
    categoria: "Ahorro/Inversión",
    keywords: ["index 100", "index", "ahorro", "inversion", "inversión", "unit linked", "stoxx", "dividend", "2028", "rescate", "capital garantizado"],
    descripcion: "Seguro de vida con componente de inversión indexada referenciado al índice STOXX GLOBAL SELECT DIVIDEND 100, con vencimiento en 2028.",
    coberturas_principales: [
      "Seguro de vida unit-linked indexado.",
      "Garantía del 100% del capital invertido a vencimiento en 2028, según condiciones.",
      "Participación en la revalorización del índice bursátil según condiciones particulares.",
      "Cobertura de fallecimiento durante la vigencia."
    ],
    limites_clave: [
      "Capital garantizado solo a vencimiento, no necesariamente en rescate anticipado.",
      "El rescate anticipado puede implicar pérdidas.",
      "Existen gastos de gestión y gastos del seguro.",
      "Plazo mínimo recomendado: mantener hasta vencimiento."
    ],
    exclusiones_o_precauciones: [
      "No presentar como inversión sin riesgo salvo garantía a vencimiento.",
      "Explicar claramente riesgo de mercado y riesgo de rescate anticipado.",
      "Derivar al agente antes de recomendar contratación."
    ],
    respuesta_segura: "Es un producto de ahorro-inversión con garantía a vencimiento, pero con riesgo si se rescata antes. Hay que revisar condiciones particulares y perfil del cliente."
  }
};

const PRODUCT_CATEGORIES = {
  hogar: ["hogar", "comunidad"],
  vehiculos: ["autos", "motor", "motos"],
  empresa: ["mi_empresa", "negocio"],
  salud: ["salud_premium", "salud_single", "salud_clinic", "enfermedades_graves", "dental"],
  vida_personas: ["vida_riesgo", "vida_facil", "proteccion_familiar", "profesional_baremado", "profesional_plus"],
  ahorro: ["index_100_2028"]
};

function normalizarTexto(texto = "") {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectarProducto(texto = "") {
  const t = normalizarTexto(texto);

  let mejorProducto = null;
  let mejorPuntuacion = 0;

  for (const [id, producto] of Object.entries(PRODUCTS_DATA)) {
    const score = (producto.keywords || []).reduce((acc, keyword) => {
      const k = normalizarTexto(keyword);
      return acc + (t.includes(k) ? 1 : 0);
    }, 0);

    if (score > mejorPuntuacion) {
      mejorPuntuacion = score;
      mejorProducto = id;
    }
  }

  return mejorPuntuacion > 0 ? mejorProducto : null;
}

function obtenerContextoProducto(productId) {
  const producto = PRODUCTS_DATA[productId];
  if (!producto) return null;

  return `Producto: ${producto.nombre}\nCategoría: ${producto.categoria}\nDescripción: ${producto.descripcion}\n\nCoberturas principales:\n- ${(producto.coberturas_principales || []).join("\n- ")}\n\nLímites clave:\n- ${(producto.limites_clave || []).join("\n- ")}\n\nAmpliaciones/Notas:\n- ${(producto.ampliaciones || []).join("\n- ")}\n\nExclusiones o precauciones:\n- ${(producto.exclusiones_o_precauciones || []).join("\n- ")}\n\nRespuesta segura recomendada: ${producto.respuesta_segura}`;
}

function obtenerResumenGeneral() {
  return Object.entries(PRODUCTS_DATA)
    .map(([id, p]) => `${id}: ${p.nombre} — ${p.descripcion}`)
    .join("\n");
}

module.exports = {
  PRODUCTS_DATA,
  PRODUCT_CATEGORIES,
  detectarProducto,
  obtenerContextoProducto,
  obtenerResumenGeneral
};
