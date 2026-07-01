import SurveysPage from './SurveysPage'

const CARLA_EMAIL = 'carlagarcia@xul.es'

export default function EncuestasCarlaPage() {
  return (
    <SurveysPage
      ownerEmail={CARLA_EMAIL}
      title="Encuestas Carla"
      subtitle="Área privada · Solo visible para carlagarcia@xul.es"
    />
  )
}
