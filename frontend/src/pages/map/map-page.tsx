import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AlertTriangle,
  Building2,
  ExternalLink,
  MapPin,
  Navigation,
  Sparkles,
  Wifi,
} from 'lucide-react'
import { PageHeader, StatCard } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/empty-state'
import { ApiErrorState } from '@/components/ui/api-error-state'
import { api } from '@/services/api/client'
import { cn } from '@/lib/utils'

const KLH_FALLBACK = {
  campus: {
    name: 'KLH University — Aziz Nagar',
    latitude: 17.3932,
    longitude: 78.39275,
    address: 'Aziz Nagar, Moinabad Road, Near TS Police Academy, Hyderabad, Telangana 500075',
    pincode: '500075',
  },
  stats: { total_buildings: 8, open_complaints: 0, active_clusters: 0, hotspots: 0 },
  buildings: [
    { id: '1', name: 'Academic Block A (Engineering)', code: 'ENG-A', latitude: 17.3938, longitude: 78.3920, open_complaints: 0, total_complaints: 0, severity: 'none' },
    { id: '2', name: 'Academic Block B (Management)', code: 'ENG-B', latitude: 17.3928, longitude: 78.3935, open_complaints: 0, total_complaints: 0, severity: 'none' },
    { id: '3', name: 'Hostel Block', code: 'HOSTEL', latitude: 17.3945, longitude: 78.3918, open_complaints: 0, total_complaints: 0, severity: 'none' },
    { id: '4', name: 'Central Library', code: 'LIB', latitude: 17.3930, longitude: 78.3930, open_complaints: 0, total_complaints: 0, severity: 'none' },
    { id: '5', name: 'Computer Labs Block', code: 'LAB', latitude: 17.3935, longitude: 78.3928, open_complaints: 0, total_complaints: 0, severity: 'none' },
    { id: '6', name: 'Sports Complex', code: 'SPORTS', latitude: 17.3925, longitude: 78.3915, open_complaints: 0, total_complaints: 0, severity: 'none' },
    { id: '7', name: 'Admin & Examination Block', code: 'ADMIN', latitude: 17.3940, longitude: 78.3938, open_complaints: 0, total_complaints: 0, severity: 'none' },
    { id: '8', name: 'Cafeteria & Student Center', code: 'CAFE', latitude: 17.3932, longitude: 78.3922, open_complaints: 0, total_complaints: 0, severity: 'none' },
  ],
  clusters: [] as Array<Record<string, unknown>>,
  recent_pins: [] as Array<{ id: string; title: string; ticket_number: string; priority: string; status: string; latitude: number; longitude: number }>,
}

const SEVERITY_COLORS = {
  high: { marker: '#ef4444', ring: 'rgba(239,68,68,0.25)', label: 'High activity' },
  medium: { marker: '#f59e0b', ring: 'rgba(245,158,11,0.25)', label: 'Moderate' },
  none: { marker: '#2552eb', ring: 'rgba(37,82,235,0.2)', label: 'Normal' },
} as const

function makeIcon(severity: keyof typeof SEVERITY_COLORS, label: string) {
  const color = SEVERITY_COLORS[severity].marker
  return L.divIcon({
    className: 'klh-marker',
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;"><div style="background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 14px ${color}66"></div><span style="margin-top:4px;background:white;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:700;color:#334155;box-shadow:0 2px 8px rgba(0,0,0,0.12);white-space:nowrap">${label}</span></div>`,
    iconSize: [36, 52],
    iconAnchor: [18, 36],
  })
}

export default function MapPage() {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['map-overview'],
    queryFn: () => api.taxonomy.mapOverview(),
    retry: 1,
  })

  const overview = data?.data
  const usingFallback = isError || !overview
  const mapData = overview ?? KLH_FALLBACK
  const campus = mapData.campus

  const center: [number, number] = useMemo(
    () => [campus.latitude, campus.longitude],
    [campus.latitude, campus.longitude],
  )

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="KLH Campus" title="Campus Map" description="Loading KLH University Aziz Nagar map data…" />
        <LoadingState message="Loading campus map…" />
      </div>
    )
  }

  const filteredBuildings = selectedBuilding
    ? mapData.buildings.filter((b) => b.id === selectedBuilding)
    : mapData.buildings

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${center[0]},${center[1]}`

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="KLH University · Aziz Nagar"
        title="Campus Map"
        description="Explore KLH University Hyderabad — buildings, complaint hotspots, and AI-detected issue clusters."
        action={
          <a href={googleMapsUrl} target="_blank" rel="noreferrer">
            <Button variant="outline"><ExternalLink className="h-4 w-4" />Open in Google Maps</Button>
          </a>
        }
      />

      {usingFallback ? (
        <ApiErrorState
          title="Live map data unavailable"
          message="Showing KLH campus layout offline. Start the backend and run seed to see complaint hotspots and clusters."
          onRetry={() => refetch()}
        />
      ) : null}

      <Card className="border-brand-200 bg-gradient-to-r from-brand-50/80 to-accent-500/5 dark:border-brand-900 dark:from-brand-950/40" padding="md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="gradient-brand flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-brand-500/20">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{campus.name}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400">
                <MapPin className="h-4 w-4 shrink-0" />{campus.address}
              </p>
              <p className="mt-1 text-xs text-surface-500">Pincode: {campus.pincode} · Near TS Police Academy</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-surface-500">
            <Navigation className="h-4 w-4" />{center[0].toFixed(4)}°N, {center[1].toFixed(4)}°E
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Campus buildings" value={mapData.stats.total_buildings} icon={Building2} tone="brand" />
        <StatCard label="Open complaints" value={mapData.stats.open_complaints} icon={AlertTriangle} tone="warning" />
        <StatCard label="Active hotspots" value={mapData.stats.hotspots} icon={MapPin} tone="danger" />
        <StatCard label="Issue clusters" value={mapData.stats.active_clusters} icon={Sparkles} tone="brand" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Card title="Buildings" description="Tap to focus on map">
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              <button type="button" onClick={() => setSelectedBuilding(null)} className={cn('w-full rounded-xl border p-3 text-left text-sm transition', !selectedBuilding ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/40' : 'hover:bg-surface-50 dark:hover:bg-surface-900')}>
                <p className="font-semibold">All buildings</p>
                <p className="text-xs text-surface-500">{mapData.buildings.length} locations</p>
              </button>
              {mapData.buildings.map((b) => (
                <button key={b.id} type="button" onClick={() => setSelectedBuilding(b.id === selectedBuilding ? null : b.id)} className={cn('w-full rounded-xl border p-3 text-left transition', selectedBuilding === b.id ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/40' : 'hover:bg-surface-50 dark:hover:bg-surface-900')}>
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="text-sm font-semibold">{b.name}</p><p className="text-xs text-surface-500">{b.code}</p></div>
                    {b.open_complaints > 0 ? <Badge tone={b.severity === 'high' ? 'danger' : 'warning'}>{b.open_complaints} open</Badge> : <Badge tone="success">Clear</Badge>}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Card padding="none" className="overflow-hidden">
          <MapContainer center={center} zoom={17} style={{ height: '520px', width: '100%' }} scrollWheelZoom>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            {filteredBuildings.map((b) => {
              const sev = (b.severity as keyof typeof SEVERITY_COLORS) || 'none'
              return (
                <span key={b.id}>
                  {b.open_complaints > 0 ? (
                    <Circle center={[b.latitude, b.longitude]} radius={b.severity === 'high' ? 80 : 50} pathOptions={{ color: SEVERITY_COLORS[sev].marker, fillColor: SEVERITY_COLORS[sev].ring, fillOpacity: 0.35, weight: 1 }} />
                  ) : null}
                  <Marker position={[b.latitude, b.longitude]} icon={makeIcon(sev, b.code)}>
                    <Popup>
                      <div className="min-w-[200px] p-1">
                        <p className="font-bold">{b.name}</p>
                        <p className="mt-1 text-xs text-surface-500">KLH · {b.code}</p>
                        <p className="mt-2 text-xs">{b.open_complaints} open · {b.total_complaints} total</p>
                      </div>
                    </Popup>
                  </Marker>
                </span>
              )
            })}
          </MapContainer>
        </Card>
      </div>

      {mapData.clusters.length > 0 ? (
        <Card title="Active issue clusters">
          <div className="grid gap-4 md:grid-cols-2">
            {mapData.clusters.map((c) => (
              <div key={c.id as string} className="rounded-2xl border p-5">
                <div className="flex items-center gap-2"><Wifi className="h-4 w-4 text-brand-600" /><p className="font-semibold">{c.title as string}</p></div>
                <p className="mt-2 text-sm text-surface-500">{c.summary as string}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {mapData.recent_pins.length > 0 ? (
        <Card title="Recent campus reports">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {mapData.recent_pins.map((pin) => (
              <Link key={pin.id} to={`/complaints/${pin.id}`} className="rounded-xl border p-4 transition hover:border-brand-300">
                <p className="text-xs font-semibold text-brand-600">{pin.ticket_number}</p>
                <p className="mt-1 line-clamp-2 text-sm font-medium">{pin.title}</p>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
