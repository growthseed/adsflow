import type { ImageConfig } from '@/types/dashboard';

interface Props {
  config: ImageConfig;
}

export default function ImageWidget({ config }: Props) {
  if (!config.url) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        Sem imagem configurada
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-2">
      <img
        src={config.url}
        alt={config.alt || ''}
        className="max-w-full max-h-full"
        style={{ objectFit: config.fit || 'contain' }}
      />
    </div>
  );
}
