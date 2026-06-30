export type PlanStatus = 'no_iniciado' | 'trabajando' | 'pdt_revision' | 'finalizado'
export type SuggestionType = 'internal' | 'external'
export type QuestionType = 'scale' | 'scale_10' | 'text' | 'yes_no' | 'multi_select' | 'custom_select'

export type PlanItem = {
  id: string
  year: number
  category: string
  indicator_code: string
  document_name: string
  content: string
  notes: string | null
  responsible: string | null
  deadline: string | null
  status: PlanStatus
  evidence_url: string | null
  created_at: string
  updated_at: string
}

export type Suggestion = {
  id: string
  type: SuggestionType
  author_name: string | null
  is_anonymous: boolean
  email: string | null
  subject: string
  message: string
  status: 'new' | 'read' | 'resolved'
  created_at: string
}

export type Survey = {
  id: string
  title: string
  description: string | null
  welcome_text: string | null
  closing_text: string | null
  year: number
  status: 'draft' | 'active' | 'closed'
  created_at: string
}

export type SurveyQuestion = {
  id: string
  survey_id: string
  question_text: string
  description: string | null
  question_type: QuestionType
  category: string
  options: string | null
  is_required: boolean
  order_index: number
}

export type SurveyResponse = {
  id: string
  survey_id: string
  token: string
  employee_email: string | null
  employee_name: string | null
  is_anonymous: boolean
  submitted_at: string | null
}

export type SurveyAnswer = {
  id: string
  response_id: string
  question_id: string
  answer_text: string | null
  answer_scale: number | null
}
