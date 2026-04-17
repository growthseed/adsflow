import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

/**
 * Política de Privacidade — conforme LGPD (Lei 13.709/2018).
 *
 * Estrutura seguindo o "checklist LGPD para SaaS" da ANPD: identificação
 * do controlador, bases legais por finalidade, direitos do titular,
 * prazos de retenção, transferências internacionais, contato do DPO.
 */
const PrivacyPage = () => {
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
          <div className="w-10 h-10 bg-[var(--color-brand-600)] rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Política de Privacidade</h1>
            <p className="text-sm text-slate-500">Última atualização: 9 de abril de 2026</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-8 text-slate-700 leading-relaxed">
          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              1. Quem somos (Controlador dos dados)
            </h2>
            <p>
              O AdsFlow é uma plataforma de gestão e visualização de dados de marketing
              digital operada pela <strong>Efeito Digital Marketing e Comunicação LTDA</strong>,
              pessoa jurídica inscrita sob responsabilidade do sócio administrador
              João Wilker. Para fins da LGPD, a Efeito Digital é o{' '}
              <strong>Controlador dos dados pessoais</strong> tratados no AdsFlow.
            </p>
            <p className="mt-2">
              Encarregado pelo tratamento de dados (DPO):{' '}
              <a href="mailto:jw@efeito.digital" className="text-[var(--color-brand-600)] hover:underline">
                jw@efeito.digital
              </a>
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Dados que tratamos</h2>
            <p className="mb-3">
              Coletamos apenas o mínimo necessário para prestar o serviço. Os dados
              pessoais são divididos em três categorias:
            </p>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-slate-900">a) Dados de cadastro</p>
                <p className="text-sm">
                  Nome completo, e-mail corporativo, telefone (opcional) e empresa.
                  Fornecidos pelo próprio titular ao criar a conta ou ao aceitar um
                  convite do gestor da agência.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-900">b) Dados de uso do sistema</p>
                <p className="text-sm">
                  Registros de acesso (data/hora, IP anonimizado, navegador),
                  páginas visitadas e ações executadas. Usados para segurança e
                  auditoria interna.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  c) Dados de campanhas conectadas
                </p>
                <p className="text-sm">
                  Métricas agregadas de Meta Ads, Google Ads, Google Analytics 4,
                  Search Console e ClickUp — impressões, cliques, custo, conversões,
                  tarefas, entregas. Acessados via APIs oficiais com permissão{' '}
                  <strong>somente leitura</strong>. Não armazenamos dados pessoais
                  de visitantes dos sites dos nossos clientes.
                </p>
              </div>
            </div>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              3. Por que tratamos seus dados (finalidades e bases legais)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 pr-3 font-medium text-slate-700">
                      Finalidade
                    </th>
                    <th className="text-left py-2 pr-3 font-medium text-slate-700">
                      Base legal (LGPD art. 7º)
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-3">Autenticar o usuário e controlar acessos</td>
                    <td className="py-2 pr-3">Execução de contrato</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-3">
                      Exibir dashboards de performance das campanhas
                    </td>
                    <td className="py-2 pr-3">Execução de contrato</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-3">Enviar relatórios por e-mail</td>
                    <td className="py-2 pr-3">Execução de contrato</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-3">Prevenir fraudes e abuso da plataforma</td>
                    <td className="py-2 pr-3">Legítimo interesse</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-3">Atender requisições legais e fiscais</td>
                    <td className="py-2 pr-3">Cumprimento de obrigação legal</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">
                      Enviar comunicações de marketing (opcional)
                    </td>
                    <td className="py-2 pr-3">Consentimento (opt-in)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              4. Com quem compartilhamos
            </h2>
            <p className="mb-2">
              <strong>Não vendemos, alugamos ou comercializamos dados pessoais.</strong>{' '}
              Compartilhamos apenas com operadores necessários à prestação do serviço:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Supabase Inc.</strong> (banco de dados e autenticação) —
                hospedado em AWS, região us-east-1
              </li>
              <li>
                <strong>Vercel Inc.</strong> (hospedagem da aplicação e edge functions)
              </li>
              <li>
                <strong>Google LLC e Meta Platforms Inc.</strong> (APIs de leitura de
                campanhas, sob nossa permissão somente leitura)
              </li>
              <li>
                <strong>Autoridades competentes</strong>, quando exigido por lei ou
                ordem judicial
              </li>
            </ul>
            <p className="mt-3 text-sm text-slate-500">
              Esses operadores têm contratos de proteção de dados conosco e só
              podem tratar os dados para as finalidades específicas do AdsFlow.
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              5. Transferência internacional
            </h2>
            <p>
              Parte dos dados é armazenada em servidores fora do Brasil (AWS
              us-east-1, Vercel Edge global). A transferência ocorre com base em
              cláusulas contratuais padrão aprovadas pela ANPD e mecanismos de
              criptografia em trânsito (TLS 1.3) e em repouso (AES-256).
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              6. Por quanto tempo guardamos
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Dados de cadastro:</strong> enquanto a conta estiver ativa, e
                por até <strong>30 dias</strong> após o cancelamento (janela para recuperação)
              </li>
              <li>
                <strong>Logs de acesso:</strong> 6 meses, para cumprir o Marco Civil da
                Internet
              </li>
              <li>
                <strong>Dados de campanhas sincronizados:</strong> até 24 meses, conforme
                o tier do cliente, ou excluídos antes mediante solicitação
              </li>
              <li>
                <strong>Dados fiscais:</strong> 5 anos, conforme exigido pela legislação
                tributária
              </li>
            </ul>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              7. Seus direitos como titular (LGPD art. 18)
            </h2>
            <p className="mb-2">Você pode, a qualquer momento, solicitar:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmação da existência de tratamento dos seus dados</li>
              <li>Acesso aos dados que temos sobre você</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>
                Anonimização, bloqueio ou eliminação de dados desnecessários ou
                tratados em desconformidade com a LGPD
              </li>
              <li>Portabilidade dos dados a outro fornecedor</li>
              <li>Eliminação dos dados tratados com base em consentimento</li>
              <li>Informação sobre com quem os dados são compartilhados</li>
              <li>Revogação do consentimento</li>
            </ul>
            <p className="mt-3">
              Para exercer qualquer desses direitos, envie um e-mail para{' '}
              <a href="mailto:jw@efeito.digital" className="text-[var(--color-brand-600)] hover:underline">
                jw@efeito.digital
              </a>{' '}
              com o assunto "LGPD — Direito do titular". Respondemos em até{' '}
              <strong>15 dias</strong>.
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              8. Segurança dos dados
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Tráfego sempre criptografado (TLS 1.3)</li>
              <li>Banco de dados com criptografia em repouso (AES-256)</li>
              <li>Row Level Security (RLS) isola dados entre clientes da agência</li>
              <li>Tokens de API armazenados apenas no backend, nunca no navegador</li>
              <li>Senhas com hash bcrypt, nunca em texto puro</li>
              <li>Auditoria de acessos com registro de IP e navegador</li>
              <li>
                Princípio do menor privilégio — cada usuário só vê o que precisa
              </li>
            </ul>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              9. Acesso às APIs do Google e Meta
            </h2>
            <p>
              O AdsFlow usa as APIs do Google (Ads, Analytics, Search Console) e
              Meta (Ads, Pages) exclusivamente com escopos{' '}
              <strong>somente leitura</strong>. Nunca criamos, editamos ou excluímos
              campanhas, anúncios, posts ou qualquer outro recurso. Não acessamos
              Gmail, Drive, contatos, fotos ou qualquer dado pessoal dos usuários
              dessas plataformas.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              O tratamento segue a{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-brand-600)] hover:underline"
              >
                Google API Services User Data Policy
              </a>{' '}
              e os{' '}
              <a
                href="https://developers.facebook.com/terms/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-brand-600)] hover:underline"
              >
                Termos de Plataforma da Meta
              </a>
              .
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              10. Alterações nesta política
            </h2>
            <p>
              Podemos atualizar esta política periodicamente. Alterações relevantes
              serão comunicadas por e-mail com pelo menos 15 dias de antecedência.
              A data da última atualização aparece no topo desta página.
            </p>
          </section>

          {/* =============================================== */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">11. Contato</h2>
            <p>
              <strong>Efeito Digital Marketing e Comunicação LTDA</strong>
              <br />
              Encarregado de dados (DPO): João Wilker
              <br />
              E-mail:{' '}
              <a href="mailto:jw@efeito.digital" className="text-[var(--color-brand-600)] hover:underline">
                jw@efeito.digital
              </a>
              <br />
              Website:{' '}
              <a
                href="https://efeito.digital"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-brand-600)] hover:underline"
              >
                efeito.digital
              </a>
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Você também pode registrar reclamações diretamente na{' '}
              <a
                href="https://www.gov.br/anpd/pt-br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-brand-600)] hover:underline"
              >
                Autoridade Nacional de Proteção de Dados (ANPD)
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
