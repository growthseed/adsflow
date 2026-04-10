import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

/**
 * Termos de Uso do AdsFlow. Complementares à Política de Privacidade.
 * Escritos em português simples, sem jargão jurídico desnecessário.
 */
const TermsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao AdsFlow
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Termos de Uso</h1>
            <p className="text-sm text-slate-500">Última atualização: 9 de abril de 2026</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-8 text-slate-700 leading-relaxed">
          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              1. Aceitação destes termos
            </h2>
            <p>
              Ao acessar e usar o AdsFlow, você concorda com estes Termos de Uso e
              com nossa{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline">
                Política de Privacidade
              </Link>
              . O AdsFlow é operado pela{' '}
              <strong>Efeito Digital Marketing e Comunicação LTDA</strong>. Se você
              não concorda com algum item, por favor não use a plataforma.
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              2. O que é o AdsFlow
            </h2>
            <p className="mb-2">
              O AdsFlow é uma plataforma interna da Efeito Digital que oferece aos
              nossos clientes:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dashboards de performance de mídia paga (Meta Ads, Google Ads)</li>
              <li>Visualização do andamento dos projetos e entregas</li>
              <li>Relatórios automatizados</li>
              <li>Fluxos visuais de estratégia de campanhas</li>
              <li>Portal de acompanhamento para clientes da agência</li>
            </ul>
            <p className="mt-3 text-sm text-slate-500">
              A plataforma está em constante evolução. Podemos adicionar, modificar
              ou remover funcionalidades sem aviso prévio.
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              3. Conta de acesso
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                O acesso ao AdsFlow é concedido pela Efeito Digital a clientes ativos
                e membros da equipe da agência
              </li>
              <li>
                Você é responsável por manter suas credenciais em segurança e não
                compartilhá-las com terceiros
              </li>
              <li>
                Notifique a Efeito Digital imediatamente caso suspeite de uso não
                autorizado da sua conta
              </li>
              <li>
                Podemos suspender ou encerrar contas que descumpram estes termos ou
                a lei
              </li>
            </ul>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              4. Integrações com plataformas externas
            </h2>
            <p>
              Ao conectar suas contas do Google Ads, Meta Ads, Google Analytics,
              Search Console ou ClickUp, você autoriza o AdsFlow a acessar os dados
              dessas plataformas conforme descrito na{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline">
                Política de Privacidade
              </Link>
              .
            </p>
            <p className="mt-2">
              O AdsFlow utiliza exclusivamente escopos de{' '}
              <strong>somente leitura</strong>. Nunca criamos, editamos ou excluímos
              campanhas, anúncios, grupos de anúncios ou qualquer outro recurso nas
              suas contas conectadas.
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              5. Uso aceitável
            </h2>
            <p className="mb-2">Você concorda em não:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Usar o serviço para fins ilegais ou não autorizados</li>
              <li>Tentar acessar dados de outros clientes da agência</li>
              <li>Fazer engenharia reversa ou descompilar o software</li>
              <li>Compartilhar links internos com dados confidenciais sem autorização</li>
              <li>
                Executar scripts automatizados que sobrecarreguem a infraestrutura
              </li>
              <li>
                Usar o AdsFlow para coletar dados de terceiros sem base legal
              </li>
            </ul>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              6. Propriedade intelectual
            </h2>
            <p>
              O AdsFlow — incluindo código-fonte, design, logotipos, documentação,
              interfaces e metodologia — é de propriedade exclusiva da Efeito Digital
              Marketing e Comunicação LTDA. Você recebe uma licença limitada,
              pessoal, não exclusiva e não transferível para usar a plataforma
              enquanto for cliente ativo ou membro autorizado.
            </p>
            <p className="mt-2">
              <strong>Dados do cliente</strong> (campanhas, resultados, projetos)
              continuam sendo de propriedade do próprio cliente. A Efeito Digital
              apenas processa esses dados para exibir no AdsFlow, conforme o
              contrato de prestação de serviços vigente.
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              7. Limitação de responsabilidade
            </h2>
            <p>
              O AdsFlow é fornecido "como está", com o melhor esforço. Não
              garantimos que o serviço estará sempre disponível ou livre de
              imprecisões. A Efeito Digital não se responsabiliza por:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Decisões comerciais tomadas exclusivamente com base nos dashboards</li>
              <li>
                Indisponibilidade temporária das APIs de Google, Meta, ClickUp ou
                outras integrações de terceiros
              </li>
              <li>
                Diferenças entre os dados exibidos no AdsFlow e os painéis nativos
                das plataformas (decorrentes de timezone, atribuição ou cache)
              </li>
              <li>Perda de dados por falhas de serviços terceirizados</li>
            </ul>
            <p className="mt-2 text-sm text-slate-500">
              Nossos dashboards são uma ferramenta de apoio à decisão — decisões
              finais devem considerar contexto adicional do cliente e do mercado.
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              8. Encerramento da conta
            </h2>
            <p>
              Você pode solicitar o encerramento da sua conta a qualquer momento
              enviando um e-mail para{' '}
              <a href="mailto:jw@efeito.digital" className="text-blue-600 hover:underline">
                jw@efeito.digital
              </a>
              . Após o encerramento:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Seus dados são mantidos por 30 dias (janela de recuperação)</li>
              <li>Após esse período, dados pessoais são permanentemente excluídos</li>
              <li>
                Dados fiscais e logs exigidos por lei são retidos pelos prazos
                legais (detalhes na Política de Privacidade)
              </li>
            </ul>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              9. Alterações destes termos
            </h2>
            <p>
              Podemos atualizar estes termos periodicamente. Alterações relevantes
              serão comunicadas por e-mail ou notificação na plataforma com pelo
              menos 15 dias de antecedência. O uso continuado após a vigência da
              nova versão indica concordância.
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              10. Lei aplicável e foro
            </h2>
            <p>
              Estes termos são regidos pelas leis da República Federativa do Brasil,
              em especial pelo Marco Civil da Internet (Lei 12.965/2014) e pela Lei
              Geral de Proteção de Dados (Lei 13.709/2018). Fica eleito o foro da
              comarca de Macapá/AP para dirimir quaisquer controvérsias.
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">11. Contato</h2>
            <p>
              <strong>Efeito Digital Marketing e Comunicação LTDA</strong>
              <br />
              E-mail:{' '}
              <a href="mailto:jw@efeito.digital" className="text-blue-600 hover:underline">
                jw@efeito.digital
              </a>
              <br />
              Website:{' '}
              <a
                href="https://efeito.digital"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                efeito.digital
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
