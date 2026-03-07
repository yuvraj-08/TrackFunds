import type { StarterCapability } from '@trackfunds/types'
import { formatStatus } from '@trackfunds/utils'

const capabilities: StarterCapability[] = [
  { id: 'web', label: 'Next.js web app', status: 'ready', surface: 'web' },
  { id: 'shared', label: 'Shared workspace packages', status: 'ready', surface: 'web' },
  {
    id: 'future',
    label: 'More surfaces can be added later',
    status: 'planned',
    surface: 'desktop',
  },
]

export function CapabilityGrid() {
  return (
    <section className="capability-grid" aria-label="Starter capabilities">
      <header className="section-heading">
        <span className="eyebrow">{formatStatus(3)}</span>
        <h2>Built to become a product, not remain a demo</h2>
      </header>
      <div className="card-grid">
        {capabilities.map((capability) => (
          <article className="capability-card" key={capability.id}>
            <p className="capability-surface">{capability.surface}</p>
            <h3>{capability.label}</h3>
            <p>
              {capability.status === 'ready'
                ? 'Implemented in this starter.'
                : 'Add when the roadmap needs it.'}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
