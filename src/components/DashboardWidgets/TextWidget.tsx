import type { TextConfig } from '@/types/dashboard';

interface Props {
  config: TextConfig;
}

const SIZE_MAP = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

export default function TextWidget({ config }: Props) {
  return (
    <div
      className={`h-full flex items-center p-4 ${SIZE_MAP[config.fontSize || 'base']} text-slate-700`}
      style={{ textAlign: config.alignment || 'left' }}
    >
      <div className="w-full whitespace-pre-wrap">{config.content}</div>
    </div>
  );
}
