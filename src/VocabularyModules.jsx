import { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// VOCABULARY DATA — 8 Modules, ~500 words total
// ─────────────────────────────────────────────────────────────────────────────

const MODULES = [
  {
    id: 1,
    title: "Survival Basics",
    emoji: "🌱",
    color: "#10b981",
    colorLight: "#d1fae5",
    colorMid: "#6ee7b7",
    description: "The first words you need — greetings, courtesy & being understood",
    units: [
      {
        title: "Greetings & Farewells",
        icon: "👋",
        words: [
          { word: "hola", translation: "hello", example: "¡Hola! ¿Cómo estás?", exampleTranslation: "Hello! How are you?" },
          { word: "buenos días", translation: "good morning", example: "Buenos días, señora López.", exampleTranslation: "Good morning, Mrs. López." },
          { word: "buenas tardes", translation: "good afternoon", example: "Buenas tardes, ¿en qué puedo ayudarle?", exampleTranslation: "Good afternoon, how can I help you?" },
          { word: "buenas noches", translation: "good evening / good night", example: "Buenas noches, que duermas bien.", exampleTranslation: "Good night, sleep well." },
          { word: "adiós", translation: "goodbye", example: "Adiós, ¡hasta pronto!", exampleTranslation: "Goodbye, see you soon!" },
          { word: "hasta luego", translation: "see you later", example: "Hasta luego, fue un placer.", exampleTranslation: "See you later, it was a pleasure." },
          { word: "hasta mañana", translation: "see you tomorrow", example: "Hasta mañana, que descanses.", exampleTranslation: "See you tomorrow, have a good rest." },
          { word: "hasta pronto", translation: "see you soon", example: "Hasta pronto, te llamo mañana.", exampleTranslation: "See you soon, I'll call you tomorrow." },
          { word: "chao", translation: "bye (informal)", example: "Chao, nos vemos.", exampleTranslation: "Bye, see you." },
          { word: "¿cómo estás?", translation: "how are you? (informal)", example: "¡Hola! ¿Cómo estás, amigo?", exampleTranslation: "Hello! How are you, friend?" },
          { word: "¿cómo está usted?", translation: "how are you? (formal)", example: "¿Cómo está usted hoy, doctor?", exampleTranslation: "How are you today, doctor?" },
          { word: "bien", translation: "well / fine", example: "Estoy bien, gracias.", exampleTranslation: "I'm fine, thank you." },
          { word: "muy bien", translation: "very well", example: "Muy bien, ¿y tú?", exampleTranslation: "Very well, and you?" },
          { word: "más o menos", translation: "so-so / more or less", example: "Más o menos, tengo mucho trabajo.", exampleTranslation: "So-so, I have a lot of work." },
          { word: "¡bienvenido!", translation: "welcome!", example: "¡Bienvenido a España!", exampleTranslation: "Welcome to Spain!" },
        ],
      },
      {
        title: "Introductions",
        icon: "🤝",
        words: [
          { word: "me llamo…", translation: "my name is…", example: "Me llamo Carlos. ¿Y tú?", exampleTranslation: "My name is Carlos. And you?" },
          { word: "¿cómo te llamas?", translation: "what's your name? (informal)", example: "Hola, ¿cómo te llamas?", exampleTranslation: "Hi, what's your name?" },
          { word: "¿cómo se llama usted?", translation: "what's your name? (formal)", example: "Perdone, ¿cómo se llama usted?", exampleTranslation: "Excuse me, what is your name?" },
          { word: "mucho gusto", translation: "nice to meet you", example: "Mucho gusto, soy Ana.", exampleTranslation: "Nice to meet you, I'm Ana." },
          { word: "encantado / encantada", translation: "delighted to meet you", example: "Encantado de conocerte.", exampleTranslation: "Delighted to meet you." },
          { word: "el placer es mío", translation: "the pleasure is mine", example: "El placer es mío, bienvenido.", exampleTranslation: "The pleasure is mine, welcome." },
          { word: "este es / esta es", translation: "this is (introducing someone)", example: "Este es mi amigo Marco.", exampleTranslation: "This is my friend Marco." },
          { word: "te presento a…", translation: "let me introduce you to…", example: "Te presento a mi jefa, la señora Ruiz.", exampleTranslation: "Let me introduce you to my boss, Mrs. Ruiz." },
          { word: "soy…", translation: "I am… (identity)", example: "Soy estudiante de español.", exampleTranslation: "I am a Spanish student." },
          { word: "vengo de…", translation: "I come from…", example: "Vengo de Singapur.", exampleTranslation: "I come from Singapore." },
        ],
      },
      {
        title: "Courtesy Phrases",
        icon: "🙏",
        words: [
          { word: "por favor", translation: "please", example: "Un café, por favor.", exampleTranslation: "A coffee, please." },
          { word: "gracias", translation: "thank you", example: "Muchas gracias por tu ayuda.", exampleTranslation: "Thank you very much for your help." },
          { word: "muchas gracias", translation: "thank you very much", example: "Muchas gracias, eres muy amable.", exampleTranslation: "Thank you very much, you are very kind." },
          { word: "de nada", translation: "you're welcome", example: "—Gracias. —¡De nada!", exampleTranslation: "—Thank you. —You're welcome!" },
          { word: "perdón", translation: "sorry / excuse me", example: "Perdón, ¿puede repetir eso?", exampleTranslation: "Sorry, can you repeat that?" },
          { word: "lo siento", translation: "I'm sorry", example: "Lo siento mucho, fue mi culpa.", exampleTranslation: "I'm very sorry, it was my fault." },
          { word: "disculpe", translation: "excuse me (formal)", example: "Disculpe, ¿dónde está la salida?", exampleTranslation: "Excuse me, where is the exit?" },
          { word: "con permiso", translation: "excuse me (passing through)", example: "Con permiso, necesito pasar.", exampleTranslation: "Excuse me, I need to get through." },
          { word: "no hay problema", translation: "no problem", example: "¿Me puedes ayudar? —No hay problema.", exampleTranslation: "Can you help me? —No problem." },
          { word: "claro", translation: "of course / sure", example: "Claro, con mucho gusto.", exampleTranslation: "Of course, with pleasure." },
          { word: "claro que sí", translation: "of course yes", example: "¿Me acompañas? —¡Claro que sí!", exampleTranslation: "Will you join me? —Of course!" },
        ],
      },
      {
        title: "Being Understood",
        icon: "💬",
        words: [
          { word: "sí", translation: "yes", example: "Sí, entiendo perfectamente.", exampleTranslation: "Yes, I understand perfectly." },
          { word: "no", translation: "no", example: "No, no quiero café.", exampleTranslation: "No, I don't want coffee." },
          { word: "no entiendo", translation: "I don't understand", example: "Lo siento, no entiendo.", exampleTranslation: "I'm sorry, I don't understand." },
          { word: "no sé", translation: "I don't know", example: "No sé dónde está.", exampleTranslation: "I don't know where it is." },
          { word: "¿puede repetir?", translation: "can you repeat?", example: "¿Puede repetir más despacio, por favor?", exampleTranslation: "Can you repeat more slowly, please?" },
          { word: "más despacio", translation: "more slowly", example: "Habla más despacio, por favor.", exampleTranslation: "Speak more slowly, please." },
          { word: "¿habla inglés?", translation: "do you speak English?", example: "Perdone, ¿habla inglés?", exampleTranslation: "Excuse me, do you speak English?" },
          { word: "hablo un poco de español", translation: "I speak a little Spanish", example: "Hablo un poco de español, estoy aprendiendo.", exampleTranslation: "I speak a little Spanish, I'm learning." },
          { word: "¿qué significa…?", translation: "what does … mean?", example: "¿Qué significa 'madrugada'?", exampleTranslation: "What does 'madrugada' mean?" },
          { word: "¿cómo se dice…?", translation: "how do you say…?", example: "¿Cómo se dice 'butterfly' en español?", exampleTranslation: "How do you say 'butterfly' in Spanish?" },
          { word: "entiendo", translation: "I understand", example: "Ahora entiendo, gracias.", exampleTranslation: "Now I understand, thank you." },
          { word: "¿me entiende?", translation: "do you understand me?", example: "Hablo despacio, ¿me entiende?", exampleTranslation: "I speak slowly, do you understand me?" },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "About Yourself",
    emoji: "👤",
    color: "#6366f1",
    colorLight: "#ede9fe",
    colorMid: "#c4b5fd",
    description: "Talk about who you are — name, age, origins, work and family",
    units: [
      {
        title: "Name, Age & Nationality",
        icon: "🪪",
        words: [
          { word: "el nombre", translation: "the name", example: "¿Cuál es tu nombre completo?", exampleTranslation: "What is your full name?" },
          { word: "el apellido", translation: "the surname", example: "Mi apellido es García.", exampleTranslation: "My surname is García." },
          { word: "la edad", translation: "the age", example: "¿Cuál es tu edad?", exampleTranslation: "What is your age?" },
          { word: "tengo… años", translation: "I am … years old", example: "Tengo treinta años.", exampleTranslation: "I am thirty years old." },
          { word: "¿cuántos años tienes?", translation: "how old are you?", example: "¿Cuántos años tienes, si no es indiscreción?", exampleTranslation: "How old are you, if you don't mind me asking?" },
          { word: "la nacionalidad", translation: "the nationality", example: "¿Cuál es tu nacionalidad?", exampleTranslation: "What is your nationality?" },
          { word: "soy singaporense", translation: "I am Singaporean", example: "Soy singaporense pero vivo en España.", exampleTranslation: "I am Singaporean but I live in Spain." },
          { word: "soy español/a", translation: "I am Spanish", example: "Soy española, de Barcelona.", exampleTranslation: "I am Spanish, from Barcelona." },
          { word: "el pasaporte", translation: "the passport", example: "Mi pasaporte es singaporense.", exampleTranslation: "My passport is Singaporean." },
          { word: "soltero / soltera", translation: "single", example: "Estoy soltero por el momento.", exampleTranslation: "I'm single at the moment." },
          { word: "casado / casada", translation: "married", example: "Estoy casada desde hace cinco años.", exampleTranslation: "I have been married for five years." },
        ],
      },
      {
        title: "Where You're From & Where You Live",
        icon: "🗺️",
        words: [
          { word: "¿de dónde eres?", translation: "where are you from?", example: "¿De dónde eres originalmente?", exampleTranslation: "Where are you originally from?" },
          { word: "soy de…", translation: "I'm from…", example: "Soy de Singapur.", exampleTranslation: "I'm from Singapore." },
          { word: "¿dónde vives?", translation: "where do you live?", example: "¿Dónde vives ahora?", exampleTranslation: "Where do you live now?" },
          { word: "vivo en…", translation: "I live in…", example: "Vivo en Madrid desde hace dos años.", exampleTranslation: "I have been living in Madrid for two years." },
          { word: "el país", translation: "the country", example: "¿De qué país eres?", exampleTranslation: "What country are you from?" },
          { word: "la ciudad", translation: "the city", example: "Mi ciudad favorita es Buenos Aires.", exampleTranslation: "My favourite city is Buenos Aires." },
          { word: "el barrio", translation: "the neighbourhood", example: "Vivo en un barrio tranquilo.", exampleTranslation: "I live in a quiet neighbourhood." },
          { word: "la dirección", translation: "the address", example: "¿Cuál es tu dirección?", exampleTranslation: "What is your address?" },
          { word: "nací en…", translation: "I was born in…", example: "Nací en Singapur pero crecí en Londres.", exampleTranslation: "I was born in Singapore but grew up in London." },
          { word: "me mudé a…", translation: "I moved to…", example: "Me mudé a España hace un año.", exampleTranslation: "I moved to Spain a year ago." },
        ],
      },
      {
        title: "Your Job or Studies",
        icon: "💼",
        words: [
          { word: "¿a qué te dedicas?", translation: "what do you do for a living?", example: "¿A qué te dedicas en tu tiempo libre?", exampleTranslation: "What do you do in your free time?" },
          { word: "trabajo como…", translation: "I work as…", example: "Trabajo como ingeniero de software.", exampleTranslation: "I work as a software engineer." },
          { word: "soy estudiante", translation: "I am a student", example: "Soy estudiante de medicina.", exampleTranslation: "I am a medical student." },
          { word: "estudio…", translation: "I study…", example: "Estudio español en una academia.", exampleTranslation: "I study Spanish at a language school." },
          { word: "la empresa", translation: "the company", example: "Trabajo en una empresa tecnológica.", exampleTranslation: "I work at a tech company." },
          { word: "la universidad", translation: "the university", example: "Estudié en la Universidad de Salamanca.", exampleTranslation: "I studied at the University of Salamanca." },
          { word: "el jefe / la jefa", translation: "the boss", example: "Mi jefa es muy comprensiva.", exampleTranslation: "My boss is very understanding." },
          { word: "el colega", translation: "the colleague", example: "Mis colegas son de muchos países.", exampleTranslation: "My colleagues are from many countries." },
          { word: "el sueldo", translation: "the salary", example: "Negocié un buen sueldo.", exampleTranslation: "I negotiated a good salary." },
          { word: "trabajar desde casa", translation: "to work from home", example: "Trabajo desde casa tres días a la semana.", exampleTranslation: "I work from home three days a week." },
          { word: "estoy desempleado/a", translation: "I am unemployed", example: "Estoy desempleada pero busco trabajo.", exampleTranslation: "I'm unemployed but looking for work." },
          { word: "me jubilé", translation: "I retired", example: "Me jubilé el año pasado.", exampleTranslation: "I retired last year." },
        ],
      },
      {
        title: "Family Members",
        icon: "👨‍👩‍👧‍👦",
        words: [
          { word: "la familia", translation: "the family", example: "Mi familia es muy unida.", exampleTranslation: "My family is very close." },
          { word: "la madre / mamá", translation: "mother / mum", example: "Mi madre es profesora.", exampleTranslation: "My mother is a teacher." },
          { word: "el padre / papá", translation: "father / dad", example: "Mi padre trabaja en un banco.", exampleTranslation: "My father works in a bank." },
          { word: "los padres", translation: "the parents", example: "Mis padres viven en Singapur.", exampleTranslation: "My parents live in Singapore." },
          { word: "el hermano", translation: "the brother", example: "Tengo un hermano mayor.", exampleTranslation: "I have an older brother." },
          { word: "la hermana", translation: "the sister", example: "Mi hermana estudia medicina.", exampleTranslation: "My sister studies medicine." },
          { word: "el abuelo", translation: "the grandfather", example: "Mi abuelo tiene ochenta años.", exampleTranslation: "My grandfather is eighty years old." },
          { word: "la abuela", translation: "the grandmother", example: "La abuela cocina la mejor paella.", exampleTranslation: "Grandma cooks the best paella." },
          { word: "el hijo / la hija", translation: "son / daughter", example: "Tengo dos hijos y una hija.", exampleTranslation: "I have two sons and a daughter." },
          { word: "el marido / la esposa", translation: "husband / wife", example: "Mi esposa habla tres idiomas.", exampleTranslation: "My wife speaks three languages." },
          { word: "el novio / la novia", translation: "boyfriend / girlfriend", example: "Mi novio es de Colombia.", exampleTranslation: "My boyfriend is from Colombia." },
          { word: "el tío / la tía", translation: "uncle / aunt", example: "Mi tía vive en México.", exampleTranslation: "My aunt lives in Mexico." },
          { word: "el primo / la prima", translation: "cousin", example: "Tengo muchos primos en España.", exampleTranslation: "I have many cousins in Spain." },
          { word: "el sobrino / la sobrina", translation: "nephew / niece", example: "Mi sobrina tiene cinco años.", exampleTranslation: "My niece is five years old." },
          { word: "los suegros", translation: "in-laws", example: "Mis suegros son muy simpáticos.", exampleTranslation: "My in-laws are very nice." },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Numbers, Time & Dates",
    emoji: "🕐",
    color: "#f59e0b",
    colorLight: "#fef3c7",
    colorMid: "#fcd34d",
    description: "Count, tell the time and navigate the calendar",
    units: [
      {
        title: "Numbers 1–100",
        icon: "🔢",
        words: [
          { word: "uno / una", translation: "one", example: "Solo queda uno.", exampleTranslation: "Only one is left." },
          { word: "dos", translation: "two", example: "Tengo dos hermanos.", exampleTranslation: "I have two brothers." },
          { word: "tres", translation: "three", example: "Son las tres de la tarde.", exampleTranslation: "It is three in the afternoon." },
          { word: "cuatro", translation: "four", example: "Necesito cuatro entradas.", exampleTranslation: "I need four tickets." },
          { word: "cinco", translation: "five", example: "Dame cinco minutos.", exampleTranslation: "Give me five minutes." },
          { word: "seis", translation: "six", example: "Mi vuelo sale a las seis.", exampleTranslation: "My flight leaves at six." },
          { word: "siete", translation: "seven", example: "La reunión es a las siete.", exampleTranslation: "The meeting is at seven." },
          { word: "ocho", translation: "eight", example: "Duermo ocho horas.", exampleTranslation: "I sleep eight hours." },
          { word: "nueve", translation: "nine", example: "El trabajo empieza a las nueve.", exampleTranslation: "Work starts at nine." },
          { word: "diez", translation: "ten", example: "Cuesta diez euros.", exampleTranslation: "It costs ten euros." },
          { word: "once", translation: "eleven", example: "Son las once de la noche.", exampleTranslation: "It's eleven at night." },
          { word: "doce", translation: "twelve", example: "Comemos al mediodía, a las doce.", exampleTranslation: "We eat at noon, at twelve." },
          { word: "veinte", translation: "twenty", example: "Tengo veinte dólares.", exampleTranslation: "I have twenty dollars." },
          { word: "treinta", translation: "thirty", example: "Tengo treinta años.", exampleTranslation: "I am thirty years old." },
          { word: "cuarenta", translation: "forty", example: "Cuarenta personas vinieron a la fiesta.", exampleTranslation: "Forty people came to the party." },
          { word: "cincuenta", translation: "fifty", example: "Cincuenta por ciento de descuento.", exampleTranslation: "Fifty percent discount." },
          { word: "cien", translation: "one hundred", example: "Hay cien personas en la sala.", exampleTranslation: "There are one hundred people in the room." },
          { word: "mil", translation: "one thousand", example: "El vuelo cuesta mil euros.", exampleTranslation: "The flight costs one thousand euros." },
          { word: "primero / primera", translation: "first", example: "Vivo en el primer piso.", exampleTranslation: "I live on the first floor." },
          { word: "segundo / segunda", translation: "second", example: "Es la segunda vez que vengo.", exampleTranslation: "It's the second time I've come." },
        ],
      },
      {
        title: "Telling the Time",
        icon: "⏰",
        words: [
          { word: "¿qué hora es?", translation: "what time is it?", example: "Perdona, ¿qué hora es?", exampleTranslation: "Excuse me, what time is it?" },
          { word: "son las…", translation: "it is… (plural hours)", example: "Son las tres y media.", exampleTranslation: "It is half past three." },
          { word: "es la una", translation: "it is one o'clock", example: "Es la una en punto.", exampleTranslation: "It is exactly one o'clock." },
          { word: "y media", translation: "half past", example: "Son las dos y media.", exampleTranslation: "It is half past two." },
          { word: "y cuarto", translation: "quarter past", example: "Son las cuatro y cuarto.", exampleTranslation: "It is quarter past four." },
          { word: "menos cuarto", translation: "quarter to", example: "Son las cinco menos cuarto.", exampleTranslation: "It is quarter to five." },
          { word: "en punto", translation: "on the dot / exactly", example: "La reunión es a las diez en punto.", exampleTranslation: "The meeting is at ten on the dot." },
          { word: "de la mañana", translation: "in the morning (a.m.)", example: "Me levanto a las siete de la mañana.", exampleTranslation: "I get up at seven in the morning." },
          { word: "de la tarde", translation: "in the afternoon (p.m.)", example: "La clase es a las cuatro de la tarde.", exampleTranslation: "The class is at four in the afternoon." },
          { word: "de la noche", translation: "at night", example: "Llego a casa a las nueve de la noche.", exampleTranslation: "I get home at nine at night." },
          { word: "el mediodía", translation: "noon / midday", example: "Comemos al mediodía.", exampleTranslation: "We eat at noon." },
          { word: "la medianoche", translation: "midnight", example: "La fiesta termina a medianoche.", exampleTranslation: "The party ends at midnight." },
        ],
      },
      {
        title: "Days, Months & Calendar",
        icon: "📅",
        words: [
          { word: "lunes", translation: "Monday", example: "El lunes tengo una reunión importante.", exampleTranslation: "On Monday I have an important meeting." },
          { word: "martes", translation: "Tuesday", example: "Los martes voy al gimnasio.", exampleTranslation: "On Tuesdays I go to the gym." },
          { word: "miércoles", translation: "Wednesday", example: "El miércoles es el día más largo.", exampleTranslation: "Wednesday is the longest day." },
          { word: "jueves", translation: "Thursday", example: "El jueves tenemos clase de español.", exampleTranslation: "On Thursday we have Spanish class." },
          { word: "viernes", translation: "Friday", example: "¡Por fin es viernes!", exampleTranslation: "It's finally Friday!" },
          { word: "sábado", translation: "Saturday", example: "El sábado voy al mercado.", exampleTranslation: "On Saturday I go to the market." },
          { word: "domingo", translation: "Sunday", example: "El domingo descansamos en familia.", exampleTranslation: "On Sunday we rest as a family." },
          { word: "enero", translation: "January", example: "Enero es el mes más frío.", exampleTranslation: "January is the coldest month." },
          { word: "febrero", translation: "February", example: "Mi cumpleaños es en febrero.", exampleTranslation: "My birthday is in February." },
          { word: "marzo", translation: "March", example: "Las flores brotan en marzo.", exampleTranslation: "The flowers bloom in March." },
          { word: "abril", translation: "April", example: "En abril llueve mucho.", exampleTranslation: "It rains a lot in April." },
          { word: "mayo", translation: "May", example: "Las vacaciones empiezan en mayo.", exampleTranslation: "Holidays start in May." },
          { word: "junio", translation: "June", example: "En junio hace mucho calor.", exampleTranslation: "It's very hot in June." },
          { word: "julio", translation: "July", example: "Julio es el mes de las fiestas.", exampleTranslation: "July is the month of festivals." },
          { word: "agosto", translation: "August", example: "En agosto, toda España está de vacaciones.", exampleTranslation: "In August, all of Spain is on holiday." },
          { word: "septiembre", translation: "September", example: "Las clases empiezan en septiembre.", exampleTranslation: "Classes start in September." },
          { word: "octubre", translation: "October", example: "Octubre es mi mes favorito.", exampleTranslation: "October is my favourite month." },
          { word: "noviembre", translation: "November", example: "En noviembre ya hace frío.", exampleTranslation: "In November it's already cold." },
          { word: "diciembre", translation: "December", example: "Diciembre es mes de celebraciones.", exampleTranslation: "December is a month of celebrations." },
          { word: "hoy es…", translation: "today is…", example: "Hoy es lunes, doce de marzo.", exampleTranslation: "Today is Monday, the twelfth of March." },
          { word: "¿qué día es hoy?", translation: "what day is today?", example: "¿Qué día es hoy?", exampleTranslation: "What day is today?" },
          { word: "la semana pasada", translation: "last week", example: "La semana pasada fui a la playa.", exampleTranslation: "Last week I went to the beach." },
          { word: "la semana que viene", translation: "next week", example: "La semana que viene empieza el curso.", exampleTranslation: "Next week the course starts." },
          { word: "el año pasado", translation: "last year", example: "El año pasado viajé a México.", exampleTranslation: "Last year I travelled to Mexico." },
          { word: "el año que viene", translation: "next year", example: "El año que viene me voy a vivir a España.", exampleTranslation: "Next year I'm going to live in Spain." },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "Essential Verbs",
    emoji: "⚡",
    color: "#ef4444",
    colorLight: "#fee2e2",
    colorMid: "#fca5a5",
    description: "The most important verbs in the present tense — your building blocks",
    units: [
      {
        title: "Ser & Estar (To Be)",
        icon: "🔵",
        words: [
          { word: "soy", translation: "I am (ser)", example: "Soy médico y soy de Chile.", exampleTranslation: "I am a doctor and I am from Chile." },
          { word: "eres", translation: "you are (ser)", example: "Eres muy inteligente.", exampleTranslation: "You are very intelligent." },
          { word: "es", translation: "he/she/it is (ser)", example: "Mi hermana es abogada.", exampleTranslation: "My sister is a lawyer." },
          { word: "somos", translation: "we are (ser)", example: "Somos amigos desde hace diez años.", exampleTranslation: "We have been friends for ten years." },
          { word: "son", translation: "they are (ser)", example: "Son las personas más amables que conozco.", exampleTranslation: "They are the kindest people I know." },
          { word: "estoy", translation: "I am (estar)", example: "Estoy muy cansado hoy.", exampleTranslation: "I am very tired today." },
          { word: "estás", translation: "you are (estar)", example: "¿Estás bien? Te veo preocupado.", exampleTranslation: "Are you okay? You look worried." },
          { word: "está", translation: "he/she/it is (estar)", example: "El restaurante está cerrado los lunes.", exampleTranslation: "The restaurant is closed on Mondays." },
          { word: "estamos", translation: "we are (estar)", example: "Estamos listos para empezar.", exampleTranslation: "We are ready to start." },
          { word: "están", translation: "they are (estar)", example: "Los niños están en la escuela.", exampleTranslation: "The children are at school." },
          { word: "ser vs estar", translation: "permanent vs temporary", example: "Soy alto (always). Estoy enfermo (now).", exampleTranslation: "I am tall (permanent). I am sick (temporary)." },
        ],
      },
      {
        title: "Tener, Querer & Necesitar",
        icon: "🟡",
        words: [
          { word: "tengo", translation: "I have", example: "Tengo hambre y sed.", exampleTranslation: "I am hungry and thirsty." },
          { word: "tienes", translation: "you have", example: "¿Tienes un bolígrafo?", exampleTranslation: "Do you have a pen?" },
          { word: "tiene", translation: "he/she has", example: "Ella tiene mucho talento.", exampleTranslation: "She has a lot of talent." },
          { word: "tenemos", translation: "we have", example: "Tenemos una reunión a las tres.", exampleTranslation: "We have a meeting at three." },
          { word: "tienen", translation: "they have", example: "¿Tienen mesa para dos?", exampleTranslation: "Do you have a table for two?" },
          { word: "quiero", translation: "I want / I love", example: "Quiero aprender español.", exampleTranslation: "I want to learn Spanish." },
          { word: "quieres", translation: "you want", example: "¿Quieres un café?", exampleTranslation: "Do you want a coffee?" },
          { word: "quiere", translation: "he/she wants", example: "Mi hijo quiere ser astronauta.", exampleTranslation: "My son wants to be an astronaut." },
          { word: "necesito", translation: "I need", example: "Necesito ayuda con esto.", exampleTranslation: "I need help with this." },
          { word: "necesitas", translation: "you need", example: "Necesitas descansar más.", exampleTranslation: "You need to rest more." },
          { word: "necesita", translation: "he/she needs", example: "El coche necesita gasolina.", exampleTranslation: "The car needs petrol." },
          { word: "me gustaría", translation: "I would like", example: "Me gustaría reservar una mesa.", exampleTranslation: "I would like to book a table." },
        ],
      },
      {
        title: "Ir, Poder & Saber",
        icon: "🟢",
        words: [
          { word: "voy", translation: "I go", example: "Voy al trabajo en metro.", exampleTranslation: "I go to work by metro." },
          { word: "vas", translation: "you go", example: "¿Adónde vas esta tarde?", exampleTranslation: "Where are you going this afternoon?" },
          { word: "va", translation: "he/she goes", example: "Mi madre va al mercado cada sábado.", exampleTranslation: "My mother goes to the market every Saturday." },
          { word: "vamos", translation: "we go / let's go", example: "¡Vamos a la playa!", exampleTranslation: "Let's go to the beach!" },
          { word: "van", translation: "they go", example: "Ellos van al aeropuerto ahora.", exampleTranslation: "They are going to the airport now." },
          { word: "puedo", translation: "I can", example: "Puedo hablar tres idiomas.", exampleTranslation: "I can speak three languages." },
          { word: "puedes", translation: "you can", example: "¿Puedes ayudarme un momento?", exampleTranslation: "Can you help me for a moment?" },
          { word: "puede", translation: "he/she can", example: "¿Puede repetir más despacio?", exampleTranslation: "Can you repeat more slowly?" },
          { word: "podemos", translation: "we can", example: "Podemos llegar en diez minutos.", exampleTranslation: "We can arrive in ten minutes." },
          { word: "sé", translation: "I know (how to)", example: "Sé cocinar la paella.", exampleTranslation: "I know how to cook paella." },
          { word: "sabes", translation: "you know (how to)", example: "¿Sabes dónde está la farmacia?", exampleTranslation: "Do you know where the pharmacy is?" },
          { word: "sabe", translation: "he/she knows", example: "Ella sabe hablar cinco idiomas.", exampleTranslation: "She knows how to speak five languages." },
        ],
      },
      {
        title: "Hacer & Other Key Verbs",
        icon: "🔴",
        words: [
          { word: "hago", translation: "I do / make", example: "Hago ejercicio cada mañana.", exampleTranslation: "I exercise every morning." },
          { word: "haces", translation: "you do / make", example: "¿Qué haces este fin de semana?", exampleTranslation: "What are you doing this weekend?" },
          { word: "hace", translation: "he/she does / it does", example: "Hace frío hoy.", exampleTranslation: "It is cold today." },
          { word: "hacemos", translation: "we do / make", example: "Hacemos una fiesta esta noche.", exampleTranslation: "We are having a party tonight." },
          { word: "como", translation: "I eat", example: "Como en la oficina.", exampleTranslation: "I eat at the office." },
          { word: "bebo", translation: "I drink", example: "Bebo mucha agua.", exampleTranslation: "I drink a lot of water." },
          { word: "vivo", translation: "I live", example: "Vivo en el centro de la ciudad.", exampleTranslation: "I live in the city centre." },
          { word: "hablo", translation: "I speak / talk", example: "Hablo español todos los días.", exampleTranslation: "I speak Spanish every day." },
          { word: "trabajo", translation: "I work", example: "Trabajo en tecnología.", exampleTranslation: "I work in technology." },
          { word: "aprendo", translation: "I learn", example: "Aprendo español con Habla.", exampleTranslation: "I learn Spanish with Habla." },
          { word: "entiendo", translation: "I understand", example: "Entiendo un poco.", exampleTranslation: "I understand a little." },
          { word: "pienso", translation: "I think", example: "Pienso que es una buena idea.", exampleTranslation: "I think it is a good idea." },
        ],
      },
    ],
  },
  {
    id: 5,
    title: "Everyday Topics",
    emoji: "🛍️",
    color: "#ec4899",
    colorLight: "#fce7f3",
    colorMid: "#f9a8d4",
    description: "Navigate real life — food, shopping, directions and transport",
    units: [
      {
        title: "Food & Drink — Ordering",
        icon: "🍽️",
        words: [
          { word: "una mesa para dos", translation: "a table for two", example: "Buenos días, ¿tiene una mesa para dos?", exampleTranslation: "Good morning, do you have a table for two?" },
          { word: "la carta / el menú", translation: "the menu", example: "¿Me puede traer la carta, por favor?", exampleTranslation: "Can you bring me the menu, please?" },
          { word: "¿qué recomienda?", translation: "what do you recommend?", example: "¿Qué recomienda hoy?", exampleTranslation: "What do you recommend today?" },
          { word: "voy a tomar…", translation: "I'll have…", example: "Voy a tomar el plato del día.", exampleTranslation: "I'll have the dish of the day." },
          { word: "para mí…", translation: "for me…", example: "Para mí, una ensalada mixta.", exampleTranslation: "For me, a mixed salad." },
          { word: "la cuenta", translation: "the bill", example: "¿Me trae la cuenta, por favor?", exampleTranslation: "Can you bring me the bill, please?" },
          { word: "está incluido el servicio", translation: "is service included?", example: "¿Está incluido el servicio en la cuenta?", exampleTranslation: "Is service included in the bill?" },
          { word: "soy alérgico/a a…", translation: "I'm allergic to…", example: "Soy alérgico al gluten.", exampleTranslation: "I'm allergic to gluten." },
          { word: "sin…", translation: "without…", example: "Sin cebolla, por favor.", exampleTranslation: "Without onion, please." },
          { word: "el entrante", translation: "the starter", example: "De entrante quiero la sopa.", exampleTranslation: "For the starter I'd like the soup." },
          { word: "el plato principal", translation: "the main course", example: "¿Cuál es el plato principal de hoy?", exampleTranslation: "What is today's main course?" },
          { word: "el postre", translation: "the dessert", example: "¿Qué tienen de postre?", exampleTranslation: "What do you have for dessert?" },
          { word: "la propina", translation: "the tip", example: "¿Dejas propina?", exampleTranslation: "Are you leaving a tip?" },
          { word: "¡buen provecho!", translation: "enjoy your meal!", example: "¡Aquí tiene su pedido, buen provecho!", exampleTranslation: "Here is your order, enjoy your meal!" },
          { word: "el camarero / la camarera", translation: "the waiter / waitress", example: "El camarero es muy atento.", exampleTranslation: "The waiter is very attentive." },
        ],
      },
      {
        title: "Shopping",
        icon: "🛒",
        words: [
          { word: "¿cuánto cuesta?", translation: "how much does it cost?", example: "¿Cuánto cuesta este abrigo?", exampleTranslation: "How much does this coat cost?" },
          { word: "¿cuánto es?", translation: "how much is it?", example: "¿Cuánto es en total?", exampleTranslation: "How much is it in total?" },
          { word: "es demasiado caro", translation: "it is too expensive", example: "Es demasiado caro para mí.", exampleTranslation: "It is too expensive for me." },
          { word: "¿tiene algo más barato?", translation: "do you have something cheaper?", example: "¿Tiene algo más barato en azul?", exampleTranslation: "Do you have something cheaper in blue?" },
          { word: "la talla", translation: "the size (clothing)", example: "¿Tiene esto en talla mediana?", exampleTranslation: "Do you have this in medium size?" },
          { word: "el número", translation: "the size (shoes)", example: "Calzo el número cuarenta y dos.", exampleTranslation: "I wear size forty-two." },
          { word: "¿puedo probármelo?", translation: "can I try it on?", example: "¿Puedo probármelo?", exampleTranslation: "Can I try it on?" },
          { word: "el probador", translation: "the fitting room", example: "Los probadores están al fondo.", exampleTranslation: "The fitting rooms are at the back." },
          { word: "me lo llevo", translation: "I'll take it", example: "Me gusta. Me lo llevo.", exampleTranslation: "I like it. I'll take it." },
          { word: "¿aceptan tarjeta?", translation: "do you accept cards?", example: "¿Aceptan tarjeta de crédito?", exampleTranslation: "Do you accept credit cards?" },
          { word: "el recibo", translation: "the receipt", example: "¿Me puede dar el recibo?", exampleTranslation: "Can you give me the receipt?" },
          { word: "las rebajas", translation: "the sales", example: "Las rebajas empiezan mañana.", exampleTranslation: "The sales start tomorrow." },
          { word: "el descuento", translation: "the discount", example: "¿Hay algún descuento disponible?", exampleTranslation: "Is there any discount available?" },
        ],
      },
      {
        title: "Asking & Giving Directions",
        icon: "🗺️",
        words: [
          { word: "¿dónde está…?", translation: "where is…?", example: "¿Dónde está la estación de metro?", exampleTranslation: "Where is the metro station?" },
          { word: "¿cómo llego a…?", translation: "how do I get to…?", example: "¿Cómo llego al aeropuerto desde aquí?", exampleTranslation: "How do I get to the airport from here?" },
          { word: "a la derecha", translation: "to the right", example: "Gira a la derecha en la esquina.", exampleTranslation: "Turn right at the corner." },
          { word: "a la izquierda", translation: "to the left", example: "El hotel está a la izquierda.", exampleTranslation: "The hotel is to the left." },
          { word: "todo recto", translation: "straight ahead", example: "Sigue todo recto durante dos manzanas.", exampleTranslation: "Go straight ahead for two blocks." },
          { word: "girar / doblar", translation: "to turn", example: "Dobla a la derecha al final.", exampleTranslation: "Turn right at the end." },
          { word: "cruzar", translation: "to cross", example: "Cruza la calle en el semáforo.", exampleTranslation: "Cross the street at the traffic light." },
          { word: "el semáforo", translation: "the traffic light", example: "Para en el semáforo.", exampleTranslation: "Stop at the traffic light." },
          { word: "la esquina", translation: "the corner", example: "La farmacia está en la esquina.", exampleTranslation: "The pharmacy is on the corner." },
          { word: "cerca de aquí", translation: "near here", example: "¿Hay un cajero cerca de aquí?", exampleTranslation: "Is there an ATM near here?" },
          { word: "lejos de aquí", translation: "far from here", example: "El museo está un poco lejos.", exampleTranslation: "The museum is a bit far." },
          { word: "a unos… metros", translation: "about … metres away", example: "Está a unos doscientos metros.", exampleTranslation: "It's about two hundred metres away." },
          { word: "está a… minutos", translation: "it's … minutes away", example: "Está a diez minutos a pie.", exampleTranslation: "It's ten minutes on foot." },
        ],
      },
      {
        title: "Transport",
        icon: "🚆",
        words: [
          { word: "el billete / el boleto", translation: "the ticket", example: "Quiero un billete de ida y vuelta.", exampleTranslation: "I want a return ticket." },
          { word: "de ida", translation: "one way", example: "Un billete de ida a Valencia.", exampleTranslation: "A one-way ticket to Valencia." },
          { word: "de ida y vuelta", translation: "return / round trip", example: "¿Cuánto cuesta de ida y vuelta?", exampleTranslation: "How much is a return?" },
          { word: "el andén", translation: "the platform", example: "El tren sale del andén cuatro.", exampleTranslation: "The train leaves from platform four." },
          { word: "la parada", translation: "the stop / station", example: "¿Cuál es la próxima parada?", exampleTranslation: "What is the next stop?" },
          { word: "el autobús", translation: "the bus", example: "¿Qué autobús va al centro?", exampleTranslation: "Which bus goes to the centre?" },
          { word: "el metro", translation: "the metro / underground", example: "El metro es rápido y barato.", exampleTranslation: "The metro is fast and cheap." },
          { word: "el tren", translation: "the train", example: "El tren a Madrid sale a las ocho.", exampleTranslation: "The train to Madrid leaves at eight." },
          { word: "el taxi", translation: "the taxi", example: "¿Me puede llamar un taxi?", exampleTranslation: "Can you call me a taxi?" },
          { word: "el aeropuerto", translation: "the airport", example: "¿Cómo llego al aeropuerto?", exampleTranslation: "How do I get to the airport?" },
          { word: "la salida", translation: "the exit / departure", example: "¿Por dónde es la salida?", exampleTranslation: "Which way is the exit?" },
          { word: "la llegada", translation: "the arrival", example: "¿A qué hora es la llegada?", exampleTranslation: "What time is the arrival?" },
          { word: "¿a qué hora sale…?", translation: "what time does … leave?", example: "¿A qué hora sale el próximo tren?", exampleTranslation: "What time does the next train leave?" },
          { word: "retrasado", translation: "delayed / late", example: "El vuelo está retrasado dos horas.", exampleTranslation: "The flight is delayed by two hours." },
        ],
      },
    ],
  },
  {
    id: 6,
    title: "Questions & Conversation",
    emoji: "❓",
    color: "#0ea5e9",
    colorLight: "#e0f2fe",
    colorMid: "#7dd3fc",
    description: "Ask anything and keep conversations flowing naturally",
    units: [
      {
        title: "The 5 Ws + Cómo & Cuánto",
        icon: "🔎",
        words: [
          { word: "¿qué?", translation: "what?", example: "¿Qué quieres comer?", exampleTranslation: "What do you want to eat?" },
          { word: "¿quién? / ¿quiénes?", translation: "who? / who (plural)?", example: "¿Quién llama a la puerta?", exampleTranslation: "Who is knocking at the door?" },
          { word: "¿dónde?", translation: "where?", example: "¿Dónde está la farmacia?", exampleTranslation: "Where is the pharmacy?" },
          { word: "¿cuándo?", translation: "when?", example: "¿Cuándo llega tu vuelo?", exampleTranslation: "When does your flight arrive?" },
          { word: "¿por qué?", translation: "why?", example: "¿Por qué estudias español?", exampleTranslation: "Why do you study Spanish?" },
          { word: "porque…", translation: "because…", example: "Estudio español porque me encanta.", exampleTranslation: "I study Spanish because I love it." },
          { word: "¿cómo?", translation: "how?", example: "¿Cómo se hace la tortilla española?", exampleTranslation: "How do you make a Spanish omelette?" },
          { word: "¿cuánto? / ¿cuánta?", translation: "how much?", example: "¿Cuánto tiempo llevas aprendiendo?", exampleTranslation: "How long have you been learning?" },
          { word: "¿cuántos? / ¿cuántas?", translation: "how many?", example: "¿Cuántos idiomas hablas?", exampleTranslation: "How many languages do you speak?" },
          { word: "¿cuál? / ¿cuáles?", translation: "which? / which ones?", example: "¿Cuál es tu película favorita?", exampleTranslation: "Which is your favourite film?" },
          { word: "¿a qué hora?", translation: "at what time?", example: "¿A qué hora quedamos?", exampleTranslation: "What time shall we meet?" },
          { word: "¿de qué trata?", translation: "what is it about?", example: "¿De qué trata el libro?", exampleTranslation: "What is the book about?" },
        ],
      },
      {
        title: "Keeping Conversations Going",
        icon: "🗣️",
        words: [
          { word: "¿y tú?", translation: "and you?", example: "Yo soy de México. ¿Y tú?", exampleTranslation: "I'm from Mexico. And you?" },
          { word: "¿de verdad?", translation: "really? / is that so?", example: "¿De verdad hablas seis idiomas?", exampleTranslation: "Really? You speak six languages?" },
          { word: "¡qué interesante!", translation: "how interesting!", example: "¡Qué interesante! Cuéntame más.", exampleTranslation: "How interesting! Tell me more." },
          { word: "¡qué bien!", translation: "how great!", example: "Aprobé el examen. —¡Qué bien!", exampleTranslation: "I passed the exam. —How great!" },
          { word: "¡qué pena!", translation: "what a shame!", example: "No puedo ir. —¡Qué pena!", exampleTranslation: "I can't go. —What a shame!" },
          { word: "cuéntame", translation: "tell me", example: "Cuéntame, ¿cómo fue el viaje?", exampleTranslation: "Tell me, how was the trip?" },
          { word: "por ejemplo", translation: "for example", example: "Me gustan los deportes, por ejemplo el tenis.", exampleTranslation: "I like sports, for example tennis." },
          { word: "es decir", translation: "that is to say / i.e.", example: "Es decir, no puedes venir.", exampleTranslation: "That is to say, you can't come." },
          { word: "a propósito", translation: "by the way", example: "A propósito, ¿has visto a Juan?", exampleTranslation: "By the way, have you seen Juan?" },
          { word: "la verdad es que…", translation: "the truth is…", example: "La verdad es que no sé.", exampleTranslation: "The truth is, I don't know." },
          { word: "lo que pasa es que…", translation: "the thing is…", example: "Lo que pasa es que estoy ocupado.", exampleTranslation: "The thing is, I'm busy." },
          { word: "¡no me digas!", translation: "you don't say! / no way!", example: "Me casé. —¡No me digas!", exampleTranslation: "I got married. —You don't say!" },
        ],
      },
      {
        title: "Likes, Dislikes & Opinions",
        icon: "❤️",
        words: [
          { word: "me gusta…", translation: "I like…", example: "Me gusta mucho la música española.", exampleTranslation: "I really like Spanish music." },
          { word: "no me gusta…", translation: "I don't like…", example: "No me gusta el picante.", exampleTranslation: "I don't like spicy food." },
          { word: "me encanta…", translation: "I love…", example: "Me encanta viajar por España.", exampleTranslation: "I love travelling around Spain." },
          { word: "odio…", translation: "I hate…", example: "Odio madrugar en invierno.", exampleTranslation: "I hate getting up early in winter." },
          { word: "prefiero…", translation: "I prefer…", example: "Prefiero el café al té.", exampleTranslation: "I prefer coffee to tea." },
          { word: "creo que…", translation: "I think that…", example: "Creo que es una buena idea.", exampleTranslation: "I think it's a good idea." },
          { word: "en mi opinión…", translation: "in my opinion…", example: "En mi opinión, el español es precioso.", exampleTranslation: "In my opinion, Spanish is beautiful." },
          { word: "estoy de acuerdo", translation: "I agree", example: "Totalmente, estoy de acuerdo contigo.", exampleTranslation: "Totally, I agree with you." },
          { word: "no estoy de acuerdo", translation: "I disagree", example: "Lo siento, no estoy de acuerdo.", exampleTranslation: "I'm sorry, I disagree." },
          { word: "me parece…", translation: "it seems to me…", example: "Me parece una idea brillante.", exampleTranslation: "It seems to me a brilliant idea." },
          { word: "¿qué te parece?", translation: "what do you think?", example: "¿Qué te parece este restaurante?", exampleTranslation: "What do you think of this restaurant?" },
          { word: "depende", translation: "it depends", example: "¿Te gusta el cine? —Depende de la película.", exampleTranslation: "Do you like cinema? —It depends on the film." },
        ],
      },
    ],
  },
  {
    id: 7,
    title: "Social Situations",
    emoji: "🎉",
    color: "#8b5cf6",
    colorLight: "#ede9fe",
    colorMid: "#c4b5fd",
    description: "Make plans, talk about hobbies and share your opinions",
    units: [
      {
        title: "Making Plans",
        icon: "📆",
        words: [
          { word: "¿quieres…?", translation: "do you want to…?", example: "¿Quieres tomar algo esta tarde?", exampleTranslation: "Do you want to have a drink this afternoon?" },
          { word: "¿tienes planes?", translation: "do you have plans?", example: "¿Tienes planes para el fin de semana?", exampleTranslation: "Do you have plans for the weekend?" },
          { word: "¿tienes tiempo?", translation: "do you have time?", example: "¿Tienes tiempo para un café?", exampleTranslation: "Do you have time for a coffee?" },
          { word: "quedamos…", translation: "let's meet…", example: "Quedamos el sábado a las siete.", exampleTranslation: "Let's meet on Saturday at seven." },
          { word: "¿a qué hora quedamos?", translation: "what time shall we meet?", example: "¿A qué hora quedamos mañana?", exampleTranslation: "What time shall we meet tomorrow?" },
          { word: "nos vemos en…", translation: "see you at / in…", example: "Nos vemos en la entrada del cine.", exampleTranslation: "See you at the cinema entrance." },
          { word: "confirmar", translation: "to confirm", example: "¿Puedes confirmar la reserva?", exampleTranslation: "Can you confirm the booking?" },
          { word: "cancelar", translation: "to cancel", example: "Lo siento, tengo que cancelar.", exampleTranslation: "I'm sorry, I have to cancel." },
          { word: "¿te apetece…?", translation: "do you feel like…?", example: "¿Te apetece salir a cenar?", exampleTranslation: "Do you feel like going out for dinner?" },
          { word: "¡buena idea!", translation: "good idea!", example: "¿Vamos al parque? —¡Buena idea!", exampleTranslation: "Shall we go to the park? —Good idea!" },
          { word: "lo siento, no puedo", translation: "I'm sorry, I can't", example: "Lo siento, no puedo ese día.", exampleTranslation: "I'm sorry, I can't that day." },
          { word: "otro día", translation: "another day", example: "No puedo hoy, ¿quedamos otro día?", exampleTranslation: "I can't today, shall we meet another day?" },
        ],
      },
      {
        title: "Hobbies & Weekend Activities",
        icon: "🎸",
        words: [
          { word: "¿qué te gusta hacer?", translation: "what do you like doing?", example: "¿Qué te gusta hacer en tu tiempo libre?", exampleTranslation: "What do you like doing in your free time?" },
          { word: "en mi tiempo libre…", translation: "in my free time…", example: "En mi tiempo libre leo y hago deporte.", exampleTranslation: "In my free time I read and do sport." },
          { word: "el deporte", translation: "sport", example: "Me encanta practicar deporte.", exampleTranslation: "I love doing sport." },
          { word: "la música", translation: "music", example: "Toco la guitarra como hobby.", exampleTranslation: "I play guitar as a hobby." },
          { word: "el cine", translation: "the cinema / movies", example: "El fin de semana fui al cine.", exampleTranslation: "At the weekend I went to the cinema." },
          { word: "leer", translation: "to read", example: "Me gusta leer novelas históricas.", exampleTranslation: "I like reading historical novels." },
          { word: "viajar", translation: "to travel", example: "Mi pasión es viajar.", exampleTranslation: "My passion is travelling." },
          { word: "cocinar", translation: "to cook", example: "Me relajo cuando cocino.", exampleTranslation: "I relax when I cook." },
          { word: "bailar", translation: "to dance", example: "Bailamos salsa hasta las dos.", exampleTranslation: "We danced salsa until two." },
          { word: "hacer senderismo", translation: "to go hiking", example: "Los domingos hacemos senderismo.", exampleTranslation: "On Sundays we go hiking." },
          { word: "el partido", translation: "the match / game", example: "Vamos a ver el partido esta noche.", exampleTranslation: "We're going to watch the match tonight." },
          { word: "la afición", translation: "the hobby / passion", example: "Mi afición es la fotografía.", exampleTranslation: "My hobby is photography." },
          { word: "suelo…", translation: "I usually…", example: "Suelo correr los martes.", exampleTranslation: "I usually run on Tuesdays." },
        ],
      },
      {
        title: "Opinions & Social Language",
        icon: "💭",
        words: [
          { word: "a mi modo de ver", translation: "the way I see it", example: "A mi modo de ver, es lo mejor.", exampleTranslation: "The way I see it, it's the best." },
          { word: "lo que más me gusta es…", translation: "what I like most is…", example: "Lo que más me gusta es la playa.", exampleTranslation: "What I like most is the beach." },
          { word: "la verdad", translation: "honestly / actually", example: "La verdad, no sé qué decirte.", exampleTranslation: "Honestly, I don't know what to tell you." },
          { word: "sinceramente", translation: "sincerely / honestly", example: "Sinceramente, creo que es difícil.", exampleTranslation: "Honestly, I think it's difficult." },
          { word: "me alegro", translation: "I'm glad", example: "Me alegro de que hayas venido.", exampleTranslation: "I'm glad you came." },
          { word: "¡enhorabuena!", translation: "congratulations!", example: "¡Enhorabuena por tu ascenso!", exampleTranslation: "Congratulations on your promotion!" },
          { word: "¡qué lástima!", translation: "what a pity!", example: "No puede venir. —¡Qué lástima!", exampleTranslation: "He can't come. —What a pity!" },
          { word: "brindemos por…", translation: "let's toast to…", example: "¡Brindemos por el nuevo año!", exampleTranslation: "Let's toast to the new year!" },
          { word: "¡salud!", translation: "cheers! / bless you!", example: "¡Salud! Por nuestra amistad.", exampleTranslation: "Cheers! To our friendship." },
          { word: "pasarlo bien", translation: "to have a good time", example: "Espero que lo pases bien.", exampleTranslation: "I hope you have a good time." },
        ],
      },
    ],
  },
  {
    id: 8,
    title: "Practical Grammar",
    emoji: "📖",
    color: "#14b8a6",
    colorLight: "#ccfbf1",
    colorMid: "#5eead4",
    description: "The grammar rules that unlock everything else",
    units: [
      {
        title: "Gender of Nouns — el / la",
        icon: "🏷️",
        words: [
          { word: "el (artículo masculino)", translation: "the (masculine)", example: "El libro, el hombre, el día.", exampleTranslation: "The book, the man, the day." },
          { word: "la (artículo femenino)", translation: "the (feminine)", example: "La casa, la mujer, la noche.", exampleTranslation: "The house, the woman, the night." },
          { word: "los (plural masculino)", translation: "the (masculine plural)", example: "Los libros están en la mesa.", exampleTranslation: "The books are on the table." },
          { word: "las (plural femenino)", translation: "the (feminine plural)", example: "Las casas son bonitas.", exampleTranslation: "The houses are pretty." },
          { word: "un (indefinido masculino)", translation: "a / an (masculine)", example: "Quiero un café y un cruasán.", exampleTranslation: "I want a coffee and a croissant." },
          { word: "una (indefinida femenino)", translation: "a / an (feminine)", example: "Tengo una pregunta.", exampleTranslation: "I have a question." },
          { word: "unos / unas", translation: "some / a few", example: "Necesito unos minutos.", exampleTranslation: "I need a few minutes." },
          { word: "palabras masculinas -o", translation: "most -o words are masculine", example: "el libro, el coche, el vino", exampleTranslation: "the book, the car, the wine" },
          { word: "palabras femeninas -a", translation: "most -a words are feminine", example: "la mesa, la silla, la fruta", exampleTranslation: "the table, the chair, the fruit" },
          { word: "excepciones", translation: "exceptions to watch", example: "el día (m.), la mano (f.), el agua (f.)", exampleTranslation: "the day (m.), the hand (f.), the water (f.)" },
        ],
      },
      {
        title: "Adjective Agreement",
        icon: "🎨",
        words: [
          { word: "adjetivo masculino", translation: "adjective changes with noun gender", example: "El libro rojo. La camisa roja.", exampleTranslation: "The red book. The red shirt." },
          { word: "adjetivo plural", translation: "adjective agrees in number", example: "Los libros rojos. Las camisas rojas.", exampleTranslation: "The red books. The red shirts." },
          { word: "adjetivos sin cambio", translation: "some adjectives don't change", example: "El coche azul. La casa azul.", exampleTranslation: "The blue car. The blue house." },
          { word: "bueno → buena", translation: "good (m.) → good (f.)", example: "Un buen vino. Una buena idea.", exampleTranslation: "A good wine. A good idea." },
          { word: "alto → alta", translation: "tall/high (m.) → tall/high (f.)", example: "Un chico alto. Una chica alta.", exampleTranslation: "A tall boy. A tall girl." },
          { word: "interesante (invariable)", translation: "interesting (same for m./f.)", example: "Un libro interesante. Una película interesante.", exampleTranslation: "An interesting book. An interesting film." },
          { word: "grande → gran", translation: "big → great (before noun)", example: "Un gran hombre. Una gran mujer.", exampleTranslation: "A great man. A great woman." },
          { word: "nuevo/nueva", translation: "new (m./f.)", example: "Mi nuevo coche es azul.", exampleTranslation: "My new car is blue." },
        ],
      },
      {
        title: "Verb Conjugation Patterns",
        icon: "🔧",
        words: [
          { word: "yo (I)", translation: "first person singular", example: "Yo hablo, yo como, yo vivo.", exampleTranslation: "I speak, I eat, I live." },
          { word: "tú (you, informal)", translation: "second person singular", example: "Tú hablas muy bien.", exampleTranslation: "You speak very well." },
          { word: "él / ella / usted", translation: "he / she / you (formal)", example: "Él habla, ella come, usted vive.", exampleTranslation: "He speaks, she eats, you (formal) live." },
          { word: "nosotros/as (we)", translation: "first person plural", example: "Nosotros hablamos español.", exampleTranslation: "We speak Spanish." },
          { word: "vosotros/as (you all, Spain)", translation: "second person plural (Spain)", example: "¿Vosotros habláis inglés?", exampleTranslation: "Do you all speak English?" },
          { word: "ellos/ellas/ustedes", translation: "they / you all (formal)", example: "Ellos hablan muy rápido.", exampleTranslation: "They speak very fast." },
          { word: "verbos -AR: hablo", translation: "-AR verbs end in -o (yo)", example: "hablar → hablo, hablas, habla…", exampleTranslation: "to speak → I speak, you speak, he speaks…" },
          { word: "verbos -ER: como", translation: "-ER verbs end in -o (yo)", example: "comer → como, comes, come…", exampleTranslation: "to eat → I eat, you eat, he eats…" },
          { word: "verbos -IR: vivo", translation: "-IR verbs end in -o (yo)", example: "vivir → vivo, vives, vive…", exampleTranslation: "to live → I live, you live, she lives…" },
          { word: "no + verbo", translation: "negation: no before verb", example: "No hablo ruso. No como carne.", exampleTranslation: "I don't speak Russian. I don't eat meat." },
          { word: "nunca + verbo", translation: "never + verb", example: "Nunca llego tarde.", exampleTranslation: "I never arrive late." },
          { word: "tampoco", translation: "neither / not either", example: "Yo tampoco sé bailar salsa.", exampleTranslation: "I don't know how to dance salsa either." },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────

function speak(text, lang = "es-ES") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.82;
  window.speechSynthesis.speak(u);
}

function storageGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// WORD CARD
// ─────────────────────────────────────────────────────────────────────────────

function WordCard({ word, color, colorLight, learned, onToggle }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        cursor: "pointer",
        background: open ? colorLight : "#fff",
        border: `1.5px solid ${open ? color + "55" : "#e5e7eb"}`,
        borderRadius: 14,
        padding: "14px 16px",
        transition: "all 0.2s ease",
        boxShadow: open ? `0 4px 20px ${color}22` : "0 1px 4px #0000000a",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#111827", letterSpacing: "-0.2px" }}>
            {word.word}
          </span>
          <div style={{ fontSize: 12.5, color: open ? "#374151" : "#9ca3af", marginTop: 2, fontStyle: open ? "normal" : "italic" }}>
            {open ? word.translation : "tap to reveal"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={e => { e.stopPropagation(); speak(word.word); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "2px 4px", borderRadius: 6, opacity: 0.7 }}
            title="Pronounce"
          >🔊</button>
          <button
            onClick={e => { e.stopPropagation(); onToggle(); }}
            style={{
              background: learned ? color + "22" : "#f3f4f6",
              border: `1px solid ${learned ? color + "66" : "#e5e7eb"}`,
              color: learned ? color : "#9ca3af",
              borderRadius: 8, padding: "3px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}
          >
            {learned ? "✓" : "+"}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${color}33`, animation: "fadeUp 0.18s ease" }}>
          <div style={{ fontSize: 13.5, color: "#1f2937", fontStyle: "italic", lineHeight: 1.55 }}>
            "{word.example}"
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{word.exampleTranslation}</div>
          <button
            onClick={e => { e.stopPropagation(); speak(word.example); }}
            style={{
              marginTop: 8, background: "none", border: `1px solid ${color}44`,
              color: color, borderRadius: 7, padding: "3px 10px", fontSize: 11,
              cursor: "pointer", fontWeight: 600,
            }}
          >
            🔊 Hear example
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIT SECTION
// ─────────────────────────────────────────────────────────────────────────────

function UnitSection({ unit, mod, learnedIds, onToggle, globalSearch }) {
  const filtered = globalSearch
    ? unit.words.filter(w =>
        w.word.toLowerCase().includes(globalSearch) ||
        w.translation.toLowerCase().includes(globalSearch) ||
        w.example.toLowerCase().includes(globalSearch)
      )
    : unit.words;

  if (globalSearch && filtered.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{unit.icon}</span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#374151" }}>{unit.title}</h3>
        <span style={{
          fontSize: 11, background: "#f3f4f6", color: "#6b7280",
          borderRadius: 99, padding: "2px 8px", fontWeight: 600,
        }}>
          {filtered.length} words
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
        {filtered.map((w, i) => (
          <WordCard
            key={i}
            word={w}
            color={mod.color}
            colorLight={mod.colorLight}
            learned={learnedIds.has(`${mod.id}-${unit.title}-${w.word}`)}
            onToggle={() => onToggle(`${mod.id}-${unit.title}-${w.word}`)}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE CARD (overview)
// ─────────────────────────────────────────────────────────────────────────────

function ModuleCard({ mod, totalWords, learnedCount, onClick, active }) {
  const pct = totalWords ? Math.round((learnedCount / totalWords) * 100) : 0;
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        background: active ? mod.colorLight : "#fff",
        border: `2px solid ${active ? mod.color : "#e5e7eb"}`,
        borderRadius: 16, padding: "16px 18px",
        transition: "all 0.2s ease",
        boxShadow: active ? `0 4px 20px ${mod.color}28` : "0 1px 6px #0000000d",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 26 }}>{mod.emoji}</span>
        <span style={{
          fontSize: 11, fontWeight: 700, background: mod.colorLight,
          color: mod.color, border: `1px solid ${mod.colorMid}`,
          borderRadius: 99, padding: "2px 8px",
        }}>
          {learnedCount}/{totalWords}
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 15, fontWeight: 800, color: "#111827" }}>
        Module {mod.id}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 1 }}>{mod.title}</div>
      <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 4, lineHeight: 1.4 }}>{mod.description}</div>
      <div style={{ marginTop: 12, background: "#e5e7eb", borderRadius: 99, height: 5, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: mod.color, borderRadius: 99,
          transition: "width 0.5s ease",
        }} />
      </div>
      <div style={{ fontSize: 10.5, color: mod.color, fontWeight: 700, marginTop: 4 }}>{pct}% complete</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function VocabularyModules() {
  const [activeModule, setActiveModule] = useState(null);
  const [search, setSearch] = useState("");
  const [learnedIds, setLearnedIds] = useState(() => new Set(storageGet("habla_v2_learned", [])));

  const toggleLearned = (id) => {
    setLearnedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      storageSet("habla_v2_learned", [...next]);
      return next;
    });
  };

  const totalAll = MODULES.reduce((a, m) => a + m.units.reduce((b, u) => b + u.words.length, 0), 0);
  const learnedAll = learnedIds.size;
  const globalPct = Math.round((learnedAll / totalAll) * 100);

  const searchLower = search.toLowerCase().trim();
  const isSearching = searchLower.length > 0;

  const currentMod = MODULES.find(m => m.id === activeModule);

  return (
    <div style={{
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      maxWidth: 960, margin: "0 auto", padding: "0 16px 60px",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing: border-box }
      `}</style>

      {/* ── Header ── */}
      <div style={{ paddingTop: 28, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 30 }}>📚</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px" }}>
              Vocabulario
            </h2>
            <div style={{ fontSize: 12.5, color: "#6b7280" }}>8 modules · {totalAll} words · flip cards to reveal</div>
          </div>
        </div>

        {/* Overall progress */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
          border: "1px solid #bbf7d0", borderRadius: 14,
          padding: "14px 18px", marginTop: 14,
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 6 }}>
              Overall Progress — {learnedAll} / {totalAll} words learned
            </div>
            <div style={{ background: "#bbf7d0", borderRadius: 99, height: 8, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${globalPct}%`,
                background: "linear-gradient(90deg, #22c55e, #16a34a)",
                borderRadius: 99, transition: "width 0.5s ease",
              }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#16a34a" }}>{globalPct}%</div>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search any word, translation or example..."
          style={{
            width: "100%", marginTop: 14, padding: "11px 16px",
            borderRadius: 12, border: "1.5px solid #e5e7eb",
            fontSize: 14, background: "#fff", color: "#111827",
            outline: "none",
          }}
        />
      </div>

      {/* ── SEARCH MODE ── */}
      {isSearching && (
        <div>
          {MODULES.map(mod =>
            mod.units.map(unit => {
              const hits = unit.words.filter(w =>
                w.word.toLowerCase().includes(searchLower) ||
                w.translation.toLowerCase().includes(searchLower) ||
                w.example.toLowerCase().includes(searchLower)
              );
              if (!hits.length) return null;
              return (
                <div key={`${mod.id}-${unit.title}`} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: mod.color, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Module {mod.id}: {mod.title} › {unit.title}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                    {hits.map((w, i) => (
                      <WordCard key={i} word={w} color={mod.color} colorLight={mod.colorLight}
                        learned={learnedIds.has(`${mod.id}-${unit.title}-${w.word}`)}
                        onToggle={() => toggleLearned(`${mod.id}-${unit.title}-${w.word}`)} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── MODULE OVERVIEW ── */}
      {!isSearching && !activeModule && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {MODULES.map(mod => {
            const total = mod.units.reduce((a, u) => a + u.words.length, 0);
            const learned = mod.units.reduce((a, u) =>
              a + u.words.filter(w => learnedIds.has(`${mod.id}-${u.title}-${w.word}`)).length, 0);
            return (
              <ModuleCard
                key={mod.id} mod={mod} totalWords={total} learnedCount={learned}
                active={false} onClick={() => setActiveModule(mod.id)}
              />
            );
          })}
        </div>
      )}

      {/* ── MODULE DETAIL ── */}
      {!isSearching && activeModule && currentMod && (
        <div style={{ animation: "fadeUp 0.25s ease" }}>
          {/* Back + module header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 22,
            background: currentMod.colorLight, border: `1.5px solid ${currentMod.colorMid}`,
            borderRadius: 16, padding: "14px 18px",
          }}>
            <button
              onClick={() => setActiveModule(null)}
              style={{
                background: "#fff", border: `1.5px solid ${currentMod.colorMid}`,
                color: currentMod.color, borderRadius: 9, padding: "5px 12px",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              ← Back
            </button>
            <span style={{ fontSize: 24 }}>{currentMod.emoji}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: currentMod.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Module {currentMod.id}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>{currentMod.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{currentMod.description}</div>
            </div>
          </div>

          {/* Units */}
          {currentMod.units.map((unit, i) => (
            <UnitSection
              key={i} unit={unit} mod={currentMod}
              learnedIds={learnedIds} onToggle={toggleLearned}
              globalSearch=""
            />
          ))}
        </div>
      )}
    </div>
  );
}
