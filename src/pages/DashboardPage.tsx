import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  TrendingUp,
  Eye,
  MousePointer,
  Loader2,
  RefreshCw,
  Trash2,
  Edit3,
  Copy,
  Calendar,
  BarChart3
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFlows } from '@/hooks/useFlows'
import Navbar from '@/components/Layout/Navbar'
import { MetaSyncButton } from '@/components/UI/MetaSyncButton'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { flows, isLoading, error, refetch, deleteExistingFlow } = useFlows()

  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter flows based on search
  const filteredFlows = flows.filter(
    (flow) =>
      flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Stats calculation
  const stats = {
    totalFlows: flows.length,
    activeFlows: flows.filter((f) => f.tags?.includes('active')).length,
    totalNodes: flows.reduce((acc, f) => acc + (f.nodes?.length || 0), 0),
    metaSynced: flows.filter((f) => f.tags?.includes('meta-ads')).length,
  }

  const handleCreateFlow = () => {
    navigate('/editor')
  }

  const handleEditFlow = (flowId: string) => {
    navigate(`/editor/${flowId}`)
  }

  const handleDeleteFlow = async (flowId: string) => {
    if (confirm('Tem certeza que deseja excluir este flow?')) {
      await deleteExistingFlow(flowId)
    }
  }

  const handleDuplicateFlow = async (_flowId: string) => {
    alert('Função de duplicar em desenvolvimento')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Bem-vindo, {user?.name || 'Usuário'}!
            </h1>
            <p className="text-slate-600 mt-1">
              Gerencie suas estratégias de marketing e funis de conversão
            </p>
          </div>

          <div className="flex items-center gap-3">
            <MetaSyncButton />
            <button
              onClick={() => navigate('/bi')}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard B.I.</span>
            </button>
            <button
              onClick={handleCreateFlow}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Flow</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Total Flows</span>
              <LayoutGrid className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalFlows}</p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.metaSynced} sincronizados com Meta
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Flows Ativos</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.activeFlows}</p>
            <p className="text-xs text-green-600 mt-1">Em execução agora</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Total Nodes</span>
              <Eye className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalNodes}</p>
            <p className="text-xs text-slate-500 mt-1">Em todos os flows</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Integrações</span>
              <MousePointer className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">2</p>
            <p className="text-xs text-slate-500 mt-1">Meta Ads, Supabase</p>
          </div>
        </div>

        {/* Flows Section */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar flows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetch()}
                  className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Atualizar"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>

                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 ${
                      viewMode === 'grid'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 ${
                      viewMode === 'list'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Flows Content */}
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="ml-3 text-slate-600">Carregando flows...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => refetch()}
                  className="text-blue-600 hover:underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : filteredFlows.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LayoutGrid className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {searchTerm ? 'Nenhum flow encontrado' : 'Nenhum flow criado ainda'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchTerm
                    ? 'Tente buscar por outro termo'
                    : 'Crie seu primeiro flow para começar a mapear suas campanhas'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreateFlow}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Criar Primeiro Flow
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFlows.map((flow) => (
                  <div
                    key={flow.id}
                    className="group border border-slate-200 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleEditFlow(flow.id)}
                  >
                    {/* Thumbnail */}
                    <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-slate-400">
                          <LayoutGrid className="w-8 h-8" />
                        </div>
                      </div>
                      {flow.tags?.includes('meta-ads') && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-[#1877F2] text-white text-xs font-medium rounded">
                          Meta Ads
                        </div>
                      )}
                      {/* Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1 bg-white rounded-lg shadow-md p-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditFlow(flow.id)
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDuplicateFlow(flow.id)
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="Duplicar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFlow(flow.id)
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-1 truncate">
                        {flow.name}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {flow.description || 'Sem descrição'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(flow.updated_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span>{flow.nodes?.length || 0} nodes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFlows.map((flow) => (
                  <div
                    key={flow.id}
                    className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-slate-50 transition-all cursor-pointer"
                    onClick={() => handleEditFlow(flow.id)}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <LayoutGrid className="w-6 h-6 text-slate-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {flow.name}
                        </h3>
                        {flow.tags?.includes('meta-ads') && (
                          <span className="px-2 py-0.5 bg-[#1877F2] text-white text-xs font-medium rounded">
                            Meta
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 truncate">
                        {flow.description || 'Sem descrição'}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-6 text-sm text-slate-500">
                      <span>{flow.nodes?.length || 0} nodes</span>
                      <span>
                        {new Date(flow.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditFlow(flow.id)
                        }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFlow(flow.id)
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Integration Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">Integre com Meta Ads</h3>
              <p className="text-blue-100">
                Sincronize suas campanhas do Facebook e Instagram automaticamente e visualize tudo em flows interativos.
              </p>
            </div>
            <MetaSyncButton className="bg-white text-blue-600 hover:bg-blue-50" />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>Ads Flow v2.0 - Marketing Strategy Visualization</p>
          <p className="mt-1">© 2026 Efeito Digital. Todos os direitos reservados.</p>
        </footer>
      </main>
    </div>
  )
}
