/**
 * ScheduleConfig — Report scheduling configuration
 */

import { useState } from 'react';
import { Clock, Mail, X, Plus, Trash2 } from 'lucide-react';

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number;    // 0-6 (Sun-Sat)
  dayOfMonth?: number;   // 1-31
  time: string;          // HH:mm
  recipientEmails: string[];
  format: 'pdf' | 'png';
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diariamente',
  weekly: 'Semanalmente',
  biweekly: 'Quinzenalmente',
  monthly: 'Mensalmente',
};

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface Props {
  schedule: ReportSchedule | null;
  onSave: (schedule: ReportSchedule | null) => void;
  onClose: () => void;
}

export default function ScheduleConfig({ schedule, onSave, onClose }: Props) {
  const [local, setLocal] = useState<ReportSchedule>(schedule || {
    enabled: true,
    frequency: 'monthly',
    dayOfMonth: 1,
    time: '09:00',
    recipientEmails: [],
    format: 'pdf',
  });
  const [newEmail, setNewEmail] = useState('');

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (email && email.includes('@') && !local.recipientEmails.includes(email)) {
      setLocal((prev) => ({ ...prev, recipientEmails: [...prev.recipientEmails, email] }));
      setNewEmail('');
    }
  };

  const removeEmail = (email: string) => {
    setLocal((prev) => ({
      ...prev,
      recipientEmails: prev.recipientEmails.filter((e) => e !== email),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Agendamento</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Ativar envio automático</span>
            <button
              onClick={() => setLocal((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                local.enabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  local.enabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {local.enabled && (
            <>
              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Frequência</label>
                <select
                  value={local.frequency}
                  onChange={(e) => setLocal((prev) => ({ ...prev, frequency: e.target.value as ReportSchedule['frequency'] }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Day of week (for weekly/biweekly) */}
              {(local.frequency === 'weekly' || local.frequency === 'biweekly') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dia da semana</label>
                  <select
                    value={local.dayOfWeek ?? 1}
                    onChange={(e) => setLocal((prev) => ({ ...prev, dayOfWeek: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {DAY_LABELS.map((label, i) => (
                      <option key={i} value={i}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Day of month (for monthly) */}
              {local.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dia do mês</label>
                  <select
                    value={local.dayOfMonth ?? 1}
                    onChange={(e) => setLocal((prev) => ({ ...prev, dayOfMonth: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>Dia {d}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                <input
                  type="time"
                  value={local.time}
                  onChange={(e) => setLocal((prev) => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Formato</label>
                <div className="flex gap-2">
                  {(['pdf', 'png'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setLocal((prev) => ({ ...prev, format: fmt }))}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        local.format === fmt
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Destinatários</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                    placeholder="email@exemplo.com"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={addEmail}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {local.recipientEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {local.recipientEmails.map((email) => (
                      <span key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs text-slate-700">
                        {email}
                        <button onClick={() => removeEmail(email)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm"
          >
            Cancelar
          </button>
          {schedule && (
            <button
              onClick={() => { onSave(null); onClose(); }}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm"
            >
              Remover
            </button>
          )}
          <button
            onClick={() => { onSave(local); onClose(); }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
