import { useState } from 'react'
import { useMetaSync } from '@/hooks/useMetaSync'
import { useNavigate } from 'react-router-dom'

interface MetaSyncButtonProps {
  className?: string
}

export function MetaSyncButton({ className = '' }: MetaSyncButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [accountId, setAccountId] = useState('act_433655990500782')
  const [campaignId, setCampaignId] = useState('')
  const [step, setStep] = useState<'input' | 'loading' | 'success' | 'error'>('input')
  const [errorMessage, setErrorMessage] = useState('')
  const [flowId, setFlowId] = useState('')
  
  const { syncCampaign } = useMetaSync()
  const navigate = useNavigate()

  const handleSync = async () => {
    if (!accountId || !campaignId) {
      setErrorMessage('Por favor, preencha todos os campos')
      return
    }

    setStep('loading')
    setErrorMessage('')

    try {
      // NOTA: Aqui você precisará integrar com o Meta Ads MCP
      // Por enquanto, vamos criar um mock para demonstração
      
      console.log('🔄 Buscando dados do Meta Ads...')
      console.log('Account:', accountId)
      console.log('Campaign:', campaignId)

      // TODO: Substituir por chamada real ao Meta Ads MCP
      // const campaign = await metaAdsMcp.getCampaign(campaignId)
      // const adSets = await metaAdsMcp.listCampaignAdSets(campaignId)
      // const ads = await metaAdsMcp.listAds({ campaign_id: campaignId })

      // Mock de dados (remover quando integrar MCP)
      const mockCampaign = {
        id: campaignId,
        name: 'Campanha de Teste',
        objective: 'OUTCOME_ENGAGEMENT',
        status: 'ACTIVE',
        lifetime_budget: '70000',
        budget_remaining: '64448'
      }

      const mockAdSets = [
        {
          id: '123456',
          name: 'Conjunto de Anúncios',
          status: 'ACTIVE',
          optimization_goal: 'CONVERSATIONS',
          billing_event: 'IMPRESSIONS'
        }
      ]

      const mockAds = [
        {
          id: '789012',
          name: 'Anúncio 1',
          status: 'ACTIVE',
          adset_id: '123456',
          creative: { id: 'creative_1' }
        }
      ]

      const result = await syncCampaign(
        accountId,
        campaignId,
        mockCampaign,
        mockAdSets,
        mockAds
      )

      if (result.success) {
        setStep('success')
        setFlowId(result.flowId!)
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate(`/flow/${result.flowId}`)
        }, 2000)
      } else {
        setStep('error')
        setErrorMessage(result.error || 'Erro desconhecido')
      }
    } catch (error: any) {
      setStep('error')
      setErrorMessage(error.message || 'Erro ao sincronizar campanha')
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep('input')
    setErrorMessage('')
    setCampaignId('')
  }

  const handleOpen = () => {
    setIsOpen(true)
    setStep('input')
    setErrorMessage('')
  }

  return (
    <>
      {/* Botão Trigger */}
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${className}`}
      >
        <svg 
          className="w-5 h-5 text-[#1877F2]" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span className="font-medium">Sincronizar Meta Ads</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1877F2] rounded-lg flex items-center justify-center">
                  <svg 
                    className="w-6 h-6 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Sincronizar Meta Ads
                  </h2>
                  <p className="text-sm text-gray-500">
                    Importe uma campanha existente
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            {step === 'input' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conta Meta Ads
                  </label>
                  <input
                    type="text"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="act_433655990500782"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: act_XXXXX
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID da Campanha
                  </label>
                  <input
                    type="text"
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    placeholder="120237979789750760"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Encontre o ID no Meta Ads Manager
                  </p>
                </div>

                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">
                      ❌ {errorMessage}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={!accountId || !campaignId}
                    className="flex-1 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sincronizar
                  </button>
                </div>
              </div>
            )}

            {step === 'loading' && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sincronizando...
                </h3>
                <p className="text-sm text-gray-500">
                  Buscando dados do Meta Ads e criando flow
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ✅ Campanha Sincronizada!
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Flow ID: {flowId}
                </p>
                <p className="text-xs text-gray-400">
                  Redirecionando para o flow...
                </p>
              </div>
            )}

            {step === 'error' && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ❌ Erro na Sincronização
                </h3>
                <p className="text-sm text-red-600 mb-4">
                  {errorMessage}
                </p>
                <button
                  onClick={() => setStep('input')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
