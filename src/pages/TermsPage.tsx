import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao AdsFlow
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Termos de Servico</h1>
            <p className="text-sm text-slate-500">Ultima atualizacao: 26 de marco de 2026</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Aceitacao dos Termos</h2>
            <p>
              Ao acessar e utilizar o AdsFlow, voce concorda com estes Termos de Servico.
              O AdsFlow e uma ferramenta de gestao de marketing digital operada pela
              <strong> Efeito Digital Marketing e Comunicacao LTDA</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Descricao do Servico</h2>
            <p>O AdsFlow oferece:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Integracao com plataformas de anuncios (Meta Ads, Google Ads)</li>
              <li>Integracao com ferramentas de analytics (Google Analytics 4, Search Console)</li>
              <li>Dashboards interativos e configuráveis</li>
              <li>Geracao automatizada de relatorios de performance</li>
              <li>Insights baseados em inteligencia artificial</li>
              <li>Controle de metas e objetivos por indicador</li>
              <li>Fluxos visuais de funil de marketing (Funnelytics)</li>
              <li>Portal de compartilhamento para clientes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">3. Conta e Acesso</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>O acesso ao AdsFlow requer uma conta autenticada</li>
              <li>Voce e responsavel por manter a seguranca de suas credenciais</li>
              <li>Nao compartilhe suas credenciais de acesso com terceiros</li>
              <li>Notifique-nos imediatamente em caso de uso nao autorizado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Integracoes com Terceiros</h2>
            <p>
              Ao conectar suas contas do Google Ads, Meta Ads, Google Analytics ou Search Console,
              voce autoriza o AdsFlow a acessar seus dados de campanhas e metricas conforme descrito
              na nossa <Link to="/privacy" className="text-blue-600 hover:underline">Politica de Privacidade</Link>.
            </p>
            <p className="mt-2">
              O AdsFlow utiliza exclusivamente escopos de <strong>somente leitura</strong> e nao
              realiza alteracoes em suas campanhas, anuncios ou configuracoes de conta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Uso Aceitavel</h2>
            <p>Voce concorda em nao:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Utilizar o servico para fins ilegais ou nao autorizados</li>
              <li>Tentar acessar dados de outros usuarios ou clientes</li>
              <li>Realizar engenharia reversa ou descompilar o software</li>
              <li>Compartilhar links de dashboards publicos com dados sensiveis sem autorizacao</li>
              <li>Sobrecarregar os servidores com requisicoes automatizadas excessivas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Propriedade Intelectual</h2>
            <p>
              O AdsFlow, incluindo seu codigo, design, logotipos e documentacao, e propriedade
              da Efeito Digital Marketing e Comunicacao LTDA. Voce recebe uma licenca limitada,
              nao exclusiva e nao transferivel para uso da ferramenta conforme estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Limitacao de Responsabilidade</h2>
            <p>
              O AdsFlow e fornecido "como esta". Nao garantimos que o servico sera ininterrupto
              ou livre de erros. A Efeito Digital nao se responsabiliza por:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Decisoes de negocio tomadas com base nos dados exibidos</li>
              <li>Indisponibilidade temporaria das APIs de terceiros (Google, Meta)</li>
              <li>Discrepancias entre dados reportados pelas plataformas e resultados reais</li>
              <li>Perda de dados causada por fatores fora do nosso controle</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">8. Cancelamento</h2>
            <p>
              Voce pode solicitar o cancelamento da sua conta a qualquer momento.
              Ao cancelar, seus dados serao retidos por 30 dias para possivel recuperacao
              e depois permanentemente excluidos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">9. Alteracoes nos Termos</h2>
            <p>
              Reservamo-nos o direito de alterar estes termos a qualquer momento.
              Alteracoes significativas serao comunicadas por email ou notificacao no sistema.
              O uso continuado apos alteracoes constitui aceitacao dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">10. Contato</h2>
            <p>
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

export default TermsPage;
