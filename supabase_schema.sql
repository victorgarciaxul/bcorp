-- XUL B Corp Schema

create extension if not exists "uuid-ossp";

-- Plan de trabajo items
create table if not exists plan_items (
  id uuid primary key default uuid_generate_v4(),
  year integer not null default 2026,
  category text not null,
  indicator_code text not null,
  document_name text not null,
  content text not null default '',
  notes text,
  responsible text,
  deadline date,
  status text not null default 'no_iniciado' check (status in ('no_iniciado','trabajando','pdt_revision','finalizado')),
  evidence_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger para updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger plan_items_updated_at
  before update on plan_items
  for each row execute function update_updated_at();

-- Buzón de sugerencias
create table if not exists suggestions (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('internal','external')),
  author_name text,
  is_anonymous boolean not null default false,
  email text,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','read','resolved')),
  created_at timestamptz default now()
);

-- Encuestas
create table if not exists surveys (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  year integer not null default 2026,
  status text not null default 'draft' check (status in ('draft','active','closed')),
  created_at timestamptz default now()
);

-- Preguntas de encuesta
create table if not exists survey_questions (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('scale','text','yes_no')),
  category text not null default 'general',
  order_index integer not null default 0
);

-- Respuestas (tokens únicos por empleado)
create table if not exists survey_responses (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  employee_email text,
  employee_name text,
  is_anonymous boolean not null default false,
  submitted_at timestamptz
);

-- Respuestas individuales por pregunta
create table if not exists survey_answers (
  id uuid primary key default uuid_generate_v4(),
  response_id uuid references survey_responses(id) on delete cascade,
  question_id uuid references survey_questions(id) on delete cascade,
  answer_text text,
  answer_scale integer check (answer_scale between 1 and 5)
);

-- RLS: solo admins logueados leen el dashboard
alter table plan_items enable row level security;
alter table suggestions enable row level security;
alter table surveys enable row level security;
alter table survey_questions enable row level security;
alter table survey_responses enable row level security;
alter table survey_answers enable row level security;

-- Responsibles (auth) tienen acceso total
create policy "Authenticated full access on plan_items" on plan_items for all using (auth.role() = 'authenticated');
create policy "Authenticated full access on suggestions" on suggestions for all using (auth.role() = 'authenticated');
create policy "Authenticated full access on surveys" on surveys for all using (auth.role() = 'authenticated');
create policy "Authenticated full access on survey_questions" on survey_questions for all using (auth.role() = 'authenticated');
create policy "Authenticated full access on survey_responses" on survey_responses for all using (auth.role() = 'authenticated');
create policy "Authenticated full access on survey_answers" on survey_answers for all using (auth.role() = 'authenticated');

-- Formulario público: insertar sugerencias externas
create policy "Public insert external suggestions" on suggestions for insert with check (type = 'external');

-- Formulario por token: empleados responden encuesta
create policy "Token insert survey_answers" on survey_answers for insert with check (true);
create policy "Token insert survey_responses update" on survey_responses for update using (true);
create policy "Token select survey_responses" on survey_responses for select using (true);
create policy "Token select survey_questions" on survey_questions for select using (true);
create policy "Token select surveys" on surveys for select using (true);

-- Seed: datos del Excel 2026
insert into plan_items (year, category, indicator_code, document_name, responsible, deadline, status) values
('2026','Gobernanza y propósito','PSG1.1.1','Declaración de propósito','Bel',null,'trabajando'),
('2026','Gobernanza y propósito','PSG 2.1','Mapa de grupos de interés','José, Carla, Bel',null,'no_iniciado'),
('2026','Gobernanza y propósito','PSG 3.1','Procedimiento de quejas','José, Carla, Víctor',null,'no_iniciado'),
('2026','Gobernanza y propósito','PSG 3.2','Seguimiento de quejas y resumen anual','Silvia, Víctor','2026-12-01','no_iniciado'),
('2026','Gobernanza y propósito','PSG 4.1','Política de marketing y relaciones públicas','José, Carla, Jorge',null,'no_iniciado'),
('2026','Gobernanza y propósito','PSG 5.1','Acta supervisión Propósito, resultados e implementación','José, Carla, Bel','2026-06-01','trabajando'),
('2026','Trabajo justo','TJ 1','Contrato o carta de oferta','Silvia','2026-04-01','finalizado'),
('2026','Trabajo justo','TJ 1.2','Política de horarios','Silvia','2026-05-01','pdt_revision'),
('2026','Trabajo justo','TJ 2.1','Política de no solicitar historiales salariales','Silvia','2026-05-01','no_iniciado'),
('2026','Trabajo justo','TJ 2.2','Documento sobre remuneraciones y modelo de nómina','Silvia','2026-05-01','pdt_revision'),
('2026','Trabajo justo','TJ 3.2','Encuesta de satisfacción a empleados','Carla, Silvia, Elena, Víctor','2026-06-01','no_iniciado'),
('2026','Trabajo justo','TJ 4.1','Encuesta cultura organizacional','Carla, Silvia, Víctor, Elena','2026-06-01','no_iniciado'),
('2026','JEDI','JEDI 1.1','Encuesta principios JEDI','Carla, Silvia, Elena, Víctor','2026-06-01','no_iniciado'),
('2026','JEDI','JEDI 2.3','Elección y puesta en marcha de acciones JEDI','José, Carla','2026-05-01','no_iniciado'),
('2026','JEDI','JEDI 2.A','Declaración de compromiso JEDI','José, Silvia, Carla','2026-07-01','no_iniciado'),
('2026','JEDI','JEDI 2.G','Documento de política de contratación inclusiva','José, Carla, Silvia','2026-07-01','no_iniciado'),
('2026','JEDI','JEDI 2.I','Guía de lenguaje inclusivo','Bel, Elena','2026-07-01','no_iniciado'),
('2026','JEDI','JEDI 2.M','Web acorde a los estándares de accesibilidad','Víctor, Aitor','2026-07-01','no_iniciado'),
('2026','JEDI','JEDI 2.S','Participación en acción colectiva acorde a JEDI','José','2026-06-01','no_iniciado'),
('2026','Derechos humanos','DH 1.1','Documento público de respeto a los DDHH','Silvia','2026-08-01','no_iniciado'),
('2026','Derechos humanos','DH 3.3','Proceso para evaluar impactos negativos en DDHH','','',  'no_iniciado'),
('2026','Derechos humanos','HR 4.2','Evaluación de 3 decisiones de contratación materiales','José','2026-10-01','no_iniciado'),
('2026','Acción climática','CA 2.1','Plan de acción por el clima en la página web','Silvia, Aitor','2026-08-01','trabajando'),
('2026','Circularidad y gestión ambiental','ESC 1.6','Documento declarando que NO realizamos actividades con animales','Silvia','2026-05-01','no_iniciado'),
('2026','Circularidad y gestión ambiental','ESC 2.6','Evaluación de impactos ambientales negativos','Silvia','2026-08-01','no_iniciado'),
('2026','Circularidad y gestión ambiental','ESC 5.1','Evaluación de impactos ambientales en decisiones de contratación','Silvia','2026-09-01','no_iniciado'),
('2026','A. Gubernamentales y A. Colectiva','AGAC 1.1','Política pública de cabildeo responsable','José','2026-05-01','no_iniciado'),
('2026','A. Gubernamentales y A. Colectiva','GACA 2.1','Participación en acciones colectivas','José',null,'no_iniciado'),
('2026','A. Gubernamentales y A. Colectiva','GACA 2.1 A','Asesoramiento a empresas del sector en impacto social','José',null,'no_iniciado'),
('2026','A. Gubernamentales y A. Colectiva','GACA 2.1 B','Contribución a la investigación para impacto social','José',null,'no_iniciado'),
('2026','A. Gubernamentales y A. Colectiva','GACA 2.1 C','Colaboración para el avance en impacto social o ambiental','José',null,'no_iniciado'),
('2026','A. Gubernamentales y A. Colectiva','GACA 2.1 D','Documento para promover políticas públicas en impacto','José',null,'no_iniciado'),
('2026','A. Gubernamentales y A. Colectiva','GACA 2.1 E','Documento liderazgo intelectual','José',null,'no_iniciado');
