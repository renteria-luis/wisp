/**
 * Companion speech-bubble lines. Warm, non-judgmental, kawaii voice. `{name}`
 * is replaced with the user's name at render. Chosen by the day's smoking vs
 * quota (low/mid/high/over), a once-a-day morning greeting, night (sleeping),
 * and — while the craving toolkit is open — a coaching context.
 *
 * Kept out of the i18n JSON on purpose (lots of lines); we pick en/es here.
 */
import type { CoachContext } from '@/store/useCoach';

export type Lang = 'en' | 'es';
export type QuotaBand = 'low' | 'mid' | 'high' | 'over';
export type LineContext = QuotaBand | 'morning' | 'sleeping';
type Bilingual = Record<Lang, string[]>;

export const QUOTA_LINES: Record<QuotaBand, Bilingual> = {
  // 0–30% of the day's quota
  low: {
    es: [
      'Vas increíble hoy, {name}. 🌱',
      'Cada respiro cuenta y lo estás logrando.',
      'Qué orgullo me das, {name}.',
      'Así, con calma. Vas de maravilla.',
      'Tu cuerpo te lo agradece ahora mismo.',
      'Un pasito a la vez, y hoy vas firme.',
      'Me encanta verte así de bien, {name}.',
      'Sigue tranquila, lo estás haciendo genial.',
    ],
    en: [
      "You're doing amazing today, {name}. 🌱",
      "Every breath counts, and you're nailing it.",
      'So proud of you, {name}.',
      'Easy does it — you’re doing great.',
      'Your body is thanking you right now.',
      "One little step at a time, and today you're steady.",
      'I love seeing you like this, {name}.',
      "Stay calm — you've got this.",
    ],
  },
  // 31–60%
  mid: {
    es: [
      'Vas bien, {name}. Respira hondo y sigue.',
      'Estás a mitad de camino; puedes bajar el ritmo.',
      'Tranquila, un momentito a la vez.',
      'Estoy aquí contigo, {name}. Vamos con calma.',
      'Si sientes ganas, tómate 3 minutos primero.',
      'Lo estás manejando bien; sigue así.',
      'Un respiro y seguimos, {name}.',
      'No te presiones; vas por buen camino.',
    ],
    en: [
      "You're doing okay, {name}. Deep breath and keep going.",
      'You’re halfway — you can ease off the pace.',
      'Steady now, one moment at a time.',
      "I'm right here with you, {name}. Nice and calm.",
      'If the urge hits, give it 3 minutes first.',
      "You're handling this well; keep it up.",
      'One breath and we continue, {name}.',
      'No pressure — you’re on a good path.',
    ],
  },
  // 61–90%
  high: {
    es: [
      'Estás cerca de tu límite de hoy, {name}. Con cuidado.',
      'Respira; este impulso también pasa.',
      'Ya casi por hoy. ¿Un vaso de agua conmigo?',
      'Tú mandas sobre las ganas, {name}, no al revés.',
      'Un paso más y cuidamos lo de hoy.',
      'Estoy contigo; aguantemos este ratito juntos.',
      'Casi llegas al tope; respira despacio.',
      'Puedes con esto, {name}. Un respiro a la vez.',
    ],
    en: [
      "You're close to today's limit, {name}. Let's be gentle.",
      'Breathe — this urge passes too.',
      'Almost there for today. A glass of water with me?',
      "You're in charge of the craving, {name}, not the other way.",
      "One more step, let's protect today.",
      "I'm with you; let's ride this one out together.",
      'Nearly at the cap; breathe slowly.',
      'You can do this, {name}. One breath at a time.',
    ],
  },
  // 90%+ — comforting, no guilt
  over: {
    es: [
      'Está bien, {name}. Mañana es un día nuevo. 💛',
      'Hoy fue difícil, y aun así estás aquí. Eso importa.',
      'No te castigues; lo de hasta hoy sigue contando.',
      'Respira. Todo va a estar bien, {name}.',
      'Un traspié no borra tu camino. Sigo orgulloso de ti.',
      'Descansa, {name}. Mañana empezamos otra vez, juntos.',
      'Eres más que un día difícil. Te quiero bien.',
      'Suéltalo por hoy; mañana lo intentamos de nuevo.',
    ],
    en: [
      "It's okay, {name}. Tomorrow is a new day. 💛",
      "Today was hard, and you're still here. That matters.",
      "Don't be harsh on yourself; everything so far still counts.",
      "Breathe. Everything's going to be okay, {name}.",
      "One slip doesn't erase your path. Still proud of you.",
      'Rest, {name}. Tomorrow we start again, together.',
      "You're more than a hard day. I want you well.",
      "Let it go for today; we'll try again tomorrow.",
    ],
  },
};

export const MORNING_LINES: Bilingual = {
  es: [
    'Buenos días, {name}. Hoy es tuyo. ☀️',
    'Buen día, {name}. Respira; empezamos con calma.',
    'Hola, {name}. Un nuevo día, un nuevo intento.',
    'Buenos días. Estoy aquí contigo desde temprano. 💛',
    'Que sea un lindo día, {name}. Vamos suave.',
  ],
  en: [
    'Good morning, {name}. Today is yours. ☀️',
    "Morning, {name}. Breathe; let's start calm.",
    'Hi, {name}. A new day, a new try.',
    "Good morning. I'm here with you from early. 💛",
    'Have a lovely day, {name}. Nice and easy.',
  ],
};

export const SLEEPING_LINES: Bilingual = {
  es: [
    'Zzz… descansa, {name}.',
    'Es tarde; deberíamos dormir. 🌙',
    'Shh… mañana seguimos, {name}.',
    'A esta hora sueño contigo cerca.',
  ],
  en: [
    'Zzz… get some rest, {name}.',
    "It's late; we should sleep. 🌙",
    "Shh… we'll continue tomorrow, {name}.",
    'This late, I’m dreaming with you near.',
  ],
};

export const COACH_LINES: Record<CoachContext, Bilingual> = {
  breathe: {
    es: [
      'Inhala conmigo… 1, 2, 3, 4.',
      'Sostén… suave… y suelta despacio.',
      'Otra vez: entra el aire… y sale.',
      'Respira conmigo, {name}. Vamos juntos.',
      'Despacito. El aire entra… y sale.',
    ],
    en: [
      'Inhale with me… 1, 2, 3, 4.',
      'Hold… gently… and let it out slow.',
      'Again: air in… and out.',
      'Breathe with me, {name}. Together.',
      'Slowly now. Air in… and out.',
    ],
  },
  wait: {
    es: [
      'Ya casi pasa, {name}. Aguanta un poquito más.',
      'Un minuto más y esto se calma.',
      'Estoy contigo hasta que pase.',
      'Cuando el círculo termine, tú ganaste.',
      'Falta poco, {name}. Respira y espera.',
    ],
    en: [
      "It's almost over, {name}. Hang on a little more.",
      'One more minute and this settles.',
      "I'm with you until it passes.",
      'When the circle ends, you won.',
      'Almost there, {name}. Breathe and wait.',
    ],
  },
  distract: {
    es: [
      'Elige una y hazla ahora mismo, {name}.',
      'Alguna de estas te va a ayudar. ¡Prueba!',
      'Manos ocupadas, mente tranquila. Escoge una.',
      'No lo pienses mucho: toca una y ve.',
      'Cualquiera sirve, {name}. Empieza ya.',
    ],
    en: [
      'Pick one and do it right now, {name}.',
      'One of these will help. Give it a go!',
      'Busy hands, calm mind. Choose one.',
      "Don't overthink it: tap one and go.",
      'Any of them works, {name}. Start now.',
    ],
  },
};

/** A random line from `lines`, with `{name}` filled in. */
export function pickLine(lines: string[], name: string): string {
  if (lines.length === 0) return '';
  const line = lines[Math.floor(Math.random() * lines.length)]!;
  return line.replace(/\{name\}/g, name).replace(/\s+([,.!?])/g, '$1').trim();
}
