export const CATEGORIES = [
  'Gobernanza y propósito',
  'Trabajo justo',
  'JEDI',
  'Derechos humanos',
  'Acción climática',
  'Circularidad y gestión ambiental',
  'A. Gubernamentales y A. Colectiva',
] as const

export const CATEGORY_COLORS: Record<string, string> = {
  'Gobernanza y propósito': 'bg-violet-900/50 text-violet-300',
  'Trabajo justo': 'bg-blue-900/50 text-blue-300',
  'JEDI': 'bg-pink-900/50 text-pink-300',
  'Derechos humanos': 'bg-red-900/50 text-red-300',
  'Acción climática': 'bg-green-900/50 text-green-300',
  'Circularidad y gestión ambiental': 'bg-teal-900/50 text-teal-300',
  'A. Gubernamentales y A. Colectiva': 'bg-orange-900/50 text-orange-300',
}

export const STATUS_LABELS: Record<string, string> = {
  no_iniciado: 'No iniciado',
  trabajando: 'En progreso',
  pdt_revision: 'Pdt. revisión',
  finalizado: 'Finalizado',
}

export const STATUS_COLORS: Record<string, string> = {
  no_iniciado: 'bg-gray-800 text-gray-400',
  trabajando: 'bg-blue-900/50 text-blue-300',
  pdt_revision: 'bg-yellow-900/50 text-yellow-300',
  finalizado: 'bg-green-900/50 text-green-300',
}

export const STATUS_DOT: Record<string, string> = {
  no_iniciado: 'bg-gray-400',
  trabajando: 'bg-blue-500',
  pdt_revision: 'bg-yellow-500',
  finalizado: 'bg-green-500',
}

export const RESPONSIBLES = [
  'Bel', 'José', 'Carla', 'Silvia', 'Víctor', 'Elena', 'Aitor', 'Jorge',
]

export const SURVEY_QUESTION_TEMPLATES = [
  { question_text: 'En general, ¿cómo valoras tu satisfacción en XUL?', question_type: 'scale', category: 'Satisfacción', order_index: 1 },
  { question_text: '¿Te sientes valorado/a por tu trabajo?', question_type: 'scale', category: 'Satisfacción', order_index: 2 },
  { question_text: '¿Cómo valorarías tu bienestar emocional en el trabajo?', question_type: 'scale', category: 'Bienestar', order_index: 3 },
  { question_text: '¿Tienes un equilibrio adecuado entre tu vida laboral y personal?', question_type: 'scale', category: 'Bienestar', order_index: 4 },
  { question_text: '¿Te sientes parte del equipo y de la cultura de XUL?', question_type: 'scale', category: 'Pertenencia', order_index: 5 },
  { question_text: '¿Sientes que tu opinión es tenida en cuenta en las decisiones que te afectan?', question_type: 'scale', category: 'Compromiso', order_index: 6 },
  { question_text: '¿Puedes expresar ideas y preguntas sin miedo a represalias?', question_type: 'scale', category: 'Seguridad psicológica', order_index: 7 },
  { question_text: '¿Consideras que XUL promueve la diversidad, equidad e inclusión?', question_type: 'scale', category: 'JEDI', order_index: 8 },
  { question_text: '¿Hay algo concreto que mejorarías en XUL?', question_type: 'text', category: 'Abierta', order_index: 9 },
]
