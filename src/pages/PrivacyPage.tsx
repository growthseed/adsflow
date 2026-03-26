import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao AdsFlow
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Politica de Privacidade</h1>
            <p className="text-sm text-slate-500">Ultima atualizacao: 26 de marco de 2026</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Informacoes Gerais</h2>
            <p>
              O AdsFlow e uma ferramenta de gestao e visualizacao de dados de marketing digital
              desenvolvida e operada pela <strong>Efeito Digital Marketing e Comunicacao LTDA</strong>.
              Esta politica descreve como coletamos, usamos e protegemos as informacoes dos usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Dados Coletados</h2>
            <p className="mb-2">Coletamos os seguintes tipos de dados:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados de conta:</strong> nome, email, telefone fornecidos no cadastro</li>
              <li><strong>Dados de plataformas conectadas:</strong> metricas de campanhas do Meta Ads, Google Ads, Google Analytics 4 e Google Search Console (impressoes, cliques, custo, conversoes)</li>
              <li><strong>Tokens de acesso:</strong> tokens OAuth 2.0 para comunicacao com as APIs das plataformas</li>
              <li><strong>Dados de uso:</strong> paginas acessadas, funcionalidades utilizadas, horarios de acesso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">3. Como Usamos os Dados</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Exibir dashboards e relatorios de performance de campanhas</li>
              <li>Gerar insights automatizados sobre o desempenho de marketing</li>
              <li>Comparar metricas entre periodos para identificar tendencias</li>
              <li>Enviar relatorios automatizados conforme configurado pelo usuario</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Compartilhamento de Dados</h2>
            <p>
              <strong>Nao vendemos, alugamos ou compartilhamos dados pessoais ou de campanhas com terceiros.</strong> Os dados sao utilizados exclusivamente para as funcionalidades do AdsFlow.
              As unicas excecoes sao:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Supabase (banco de dados hospedado com criptografia)</li>
              <li>Vercel (hospedagem da aplicacao)</li>
              <li>N8N (automacao de workflows, auto-hospedado)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Seguranca</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Todos os dados em transito sao criptografados via TLS 1.3 (HTTPS)</li>
              <li>Banco de dados com criptografia em repouso (AES-256)</li>
              <li>Row Level Security (RLS) garante isolamento de dados entre clientes</li>
              <li>Tokens de API sao armazenados de forma segura e nunca expostos no frontend</li>
              <li>Secrets (client_secret, developer_token) sao mantidos apenas no servidor</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Acesso as APIs do Google</h2>
            <p>
              O AdsFlow acessa as APIs do Google (Ads, Analytics, Search Console) utilizando
              escopos <strong>somente leitura</strong>. A aplicacao:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>NAO cria, modifica ou exclui campanhas ou anuncios</li>
              <li>NAO acessa dados pessoais (email, perfil, contatos)</li>
              <li>NAO acessa Google Drive, Gmail ou outros servicos</li>
              <li>Apenas le metricas de performance necessarias para relatorios</li>
            </ul>
            <p className="mt-2">
              O uso dos dados esta em conformidade com a{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Google API Services User Data Policy
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Seus Direitos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Desconectar suas contas de plataformas a qualquer momento</li>
              <li>Solicitar a exclusao de todos os seus dados</li>
              <li>Exportar seus dados em formato CSV ou PDF</li>
              <li>Revogar o acesso do AdsFlow nas configuracoes de sua conta Google/Meta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">8. Contato</h2>
            <p>
              Para duvidas sobre esta politica ou para exercer seus direitos, entre em contato:
            </p>
            <p className="mt-2">
              <strong>Efeito Digital Marketing e Comunicacao LTDA</strong><br />
              Email: <a href="mailto:jw@efeito.digital" className="text-blue-600 hover:underline">jw@efeito.digital</a><br />
              Website: <a href="https://efeito.digital" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">efeito.digital</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
