/**
 * TemplatePicker — Grid of template cards to create a dashboard from
 */

import {
  Megaphone, ShoppingCart, Target, BarChart3, Plus,
} from 'lucide-react';

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: string;
}

const TEMPLATES: TemplateOption[] = [
  { id: 'meta_ads_inside_sales', name: 'Meta Ads — Inside Sales', description: 'Campanhas, Leads, CPL, Funil', icon: Megaphone, color: 'bg-[#1877F2]', category: 'Meta Ads' },
  { id: 'meta_ads_ecommerce', name: 'Meta Ads — E-commerce', description: 'ROAS, Receita, AOV, Conversões', icon: ShoppingCart, color: 'bg-[#1877F2]', category: 'Meta Ads' },
  { id: 'google_ads_inside_sales', name: 'Google Ads — Inside Sales', description: 'Campanhas, Leads, CPA, Performance', icon: Megaphone, color: 'bg-green-600', category: 'Google Ads' },
  { id: 'google_ads_ecommerce', name: 'Google Ads — E-commerce', description: 'ROAS, Receita, CPC, Shopping', icon: ShoppingCart, color: 'bg-green-600', category: 'Google Ads' },
  { id: 'crm_vendas_funil', name: 'CRM/Vendas — Funil', description: 'Leads, Oportunidades, Conversão, Perdas', icon: Target, color: 'bg-purple-600', category: 'Vendas' },
  { id: 'ecommerce_faturamento', name: 'E-commerce — Faturamento', description: 'Receita, Pedidos, Ticket, Produtos', icon: BarChart3, color: 'bg-emerald-600', category: 'E-commerce' },
];

interface Props {
  onSelectTemplate: (templateId: string) => void;
  onCreateBlank: () => void;
}

export default function TemplatePicker({ onSelectTemplate, onCreateBlank }: Props) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Criar Novo Dashboard</h1>
        <p className="text-slate-500">Escolha um template pronto ou comece do zero.</p>
      </div>

      {/* Blank option */}
      <button
        onClick={onCreateBlank}
        className="w-full mb-8 p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all text-center group"
      >
        <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
        </div>
        <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">Dashboard em Branco</h3>
        <p className="text-sm text-slate-500 mt-1">Monte do zero com drag-and-drop de widgets</p>
      </button>

      {/* Templates grid */}
      <h2 className="text-sm font-semibold text-slate-700 mb-4">Templates Prontos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className="p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center`}>
                <template.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{template.category}</p>
                <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-700">
                  {template.name}
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-500">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
