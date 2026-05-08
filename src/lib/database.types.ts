export type PlanStatus = 'no_iniciado' | 'trabajando' | 'pdt_revision' | 'finalizado'

export type SuggestionType = 'internal' | 'external'

export type Database = {
  public: {
    Tables: {
      plan_items: {
        Row: PlanItem
        Insert: Omit<PlanItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PlanItem, 'id' | 'created_at'>>
      }
      suggestions: {
        Row: Suggestion
        Insert: Omit<Suggestion, 'id' | 'created_at'>
        Update: Partial<Omit<Suggestion, 'id' | 'created_at'>>
      }
      surveys: {
        Row: Survey
        Insert: Omit<Survey, 'id' | 'created_at'>
        Update: Partial<Omit<Survey, 'id' | 'created_at'>>
      }
      survey_questions: {
        Row: SurveyQuestion
        Insert: Omit<SurveyQuestion, 'id'>
        Update: Partial<Omit<SurveyQuestion, 'id'>>
      }
      survey_responses: {
        Row: SurveyResponse
        Insert: Omit<SurveyResponse, 'id' | 'submitted_at'>
        Update: Partial<Omit<SurveyResponse, 'id'>>
      }
      survey_answers: {
        Row: SurveyAnswer
        Insert: Omit<SurveyAnswer, 'id'>
        Update: Partial<Omit<SurveyAnswer, 'id'>>
      }
    }
  }
}

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
  year: number
  status: 'draft' | 'active' | 'closed'
  created_at: string
}

export type SurveyQuestion = {
  id: string
  survey_id: string
  question_text: string
  question_type: 'scale' | 'text' | 'yes_no'
  category: string
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
