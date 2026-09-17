import { useEffect, useRef, useState } from 'react'
import { Upload, X, ImagePlus } from 'lucide-react'
import { plannerRequest } from '@/lib/plannerApi'

export interface LogoAsset { id: string; name: string; url: string }

/**
 * Biblioteca de logos por cliente. Lista e envia imagens para
 * `<client>/planner/` no bucket público; o servidor valida sessão,
 * associação ao cliente e o conteúdo da imagem.
 */
export default function LogoLibrary({ slug, onAdd, onClose }: { slug: string; onAdd: (asset: LogoAsset) => void; onClose: () => void }) {
  const [assets, setAssets] = useState<LogoAsset[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    plannerRequest<{ assets: LogoAsset[] }>('planner-assets', { client_slug: slug })
      .then(result => { if (!cancelled) setAssets(result.assets) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  async function upload(file?: File) {
    if (!file) return
    setError('')
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('Use PNG, JPEG ou WebP de até 2 MB.'); return }
    setBusy(true)
    try {
      const image = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
      const { asset } = await plannerRequest<{ asset: LogoAsset }>('planner-assets', { client_slug: slug }, { image, name: file.name.replace(/\.[^.]+$/, '') })
      setAssets(current => [asset, ...current])
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha no upload.') } finally { setBusy(false); if (input.current) input.current.value = '' }
  }

  return (
    <aside className="planner-library" aria-label="Logos do cliente">
      <header><h3>Logos do cliente</h3><button onClick={onClose} title="Fechar biblioteca" aria-label="Fechar biblioteca"><X size={18} /></button></header>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Enviar logo" onChange={e => void upload(e.target.files?.[0])} />
      <button className="planner-upload" onClick={() => input.current?.click()} disabled={busy}><Upload size={16} />{busy ? 'Enviando...' : 'Enviar logo'}</button>
      {error && <p role="alert" className="planner-error">{error}</p>}
      {loading ? <p role="status">Carregando imagens...</p> : <div className="planner-assets">{assets.map(asset => <button key={asset.id} onClick={() => onAdd(asset)} title={`Adicionar ${asset.name}`}><img src={asset.url} alt="" /><span>{asset.name}</span><ImagePlus size={14} /></button>)}</div>}
      {!loading && !assets.length && !error && <p>Nenhuma imagem cadastrada.</p>}
    </aside>
  )
}
