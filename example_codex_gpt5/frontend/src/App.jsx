import { useEffect, useMemo, useState } from 'react'
import { Button } from './components/ui/button'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const REFRESH_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

  const fetchBitcoinInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('http://localhost:3000/bitcoin-info')
      if (!res.ok) throw new Error('Falha ao buscar dados')
      const json = await res.json()
      setData(json)
      setLastUpdated(Date.now())
    } catch (e) {
      setError(e?.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBitcoinInfo()
    const interval = setInterval(fetchBitcoinInfo, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const changePercent = useMemo(() => {
    if (!data) return null
    const v = parseFloat(data['24h_price_change_percent'])
    return isNaN(v) ? null : v
  }, [data])

  const changeUsd = useMemo(() => {
    if (!data) return null
    const v = parseFloat(data['24h_price_change'])
    return isNaN(v) ? null : v
  }, [data])

  const formatCurrency = (n) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(n)

  const formatNumber = (n, digits = 2) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)

  const items = useMemo(() => {
    if (!data) return []
    const price = parseFloat(data.price)
    const high = parseFloat(data['24h_high'])
    const low = parseFloat(data['24h_low'])
    const volume = parseFloat(data['24h_volume'])
    return [
      { label: 'Preço Atual', value: isNaN(price) ? '-' : formatCurrency(price) },
      { label: 'Variação 24h %', value: changePercent === null ? '-' : `${formatNumber(changePercent, 3)}%`, color: changePercent === null ? 'text-foreground' : (changePercent >= 0 ? 'text-green-500' : 'text-red-500') },
      { label: 'Variação 24h USD', value: changeUsd === null ? '-' : formatCurrency(changeUsd), color: changeUsd === null ? 'text-foreground' : (changeUsd >= 0 ? 'text-green-500' : 'text-red-500') },
      { label: 'Máxima 24h', value: isNaN(high) ? '-' : formatCurrency(high) },
      { label: 'Mínima 24h', value: isNaN(low) ? '-' : formatCurrency(low) },
      { label: 'Volume 24h', value: isNaN(volume) ? '-' : `${formatNumber(volume, 3)} BTC` },
    ]
  }, [data, changePercent, changeUsd])

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return '—'
    const d = new Date(lastUpdated)
    return d.toLocaleString('pt-BR')
  }, [lastUpdated])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-6">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Painel Bitcoin</h1>

      <div className="w-full max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Última atualização:</span> {lastUpdatedText}
            <span className="mx-2">•</span>
            <span className="font-medium">Intervalo:</span> 10 minutos
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchBitcoinInfo} disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar agora'}
            </Button>
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-border p-4 bg-card">
              <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
              <div className={`text-2xl font-semibold ${item.color ?? ''}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
