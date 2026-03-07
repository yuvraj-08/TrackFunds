import type { StarterCapability } from '@trackfunds/types'
import { CapabilityGrid } from '@trackfunds/ui-web'
import { formatStatus } from '@trackfunds/utils'

const deliverySignals: StarterCapability[] = [
  { id: 'lint', label: 'Lint', status: 'ready', surface: 'web' },
  { id: 'typecheck', label: 'Typecheck', status: 'ready', surface: 'web' },
  { id: 'build', label: 'Build', status: 'ready', surface: 'web' },
]

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">TrackFunds starter</p>
          <h1>Launch the product with a real web foundation, not a blank workspace.</h1>
          <p className="lede">
            This base already wires shared packages, monorepo orchestration, and a Next.js app that
            can grow into a broader platform later.
          </p>
        </div>
        <div className="status-panel">
          <p className="status-label">{formatStatus(deliverySignals.length)}</p>
          <ul>
            {deliverySignals.map((signal) => (
              <li key={signal.id}>
                <span>{signal.label}</span>
                <strong>{signal.status}</strong>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CapabilityGrid />
    </main>
  )
}
