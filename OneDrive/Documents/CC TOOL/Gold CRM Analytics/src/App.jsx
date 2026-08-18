import './App.css'

const kpiStats = [
  {
    title: 'Open Pipeline',
    value: '142 Deals',
    detail: 'Total open value: $1.84M',
    delta: '+8.2% from last month'
  },
  { title: 'Win Rate', value: '26.4%', detail: 'Target: 30%', delta: '-0.6% vs target' },
  { title: 'Avg. Deal Cycle', value: '18 days', detail: 'Median follow-up', delta: '-2 days (faster)' },
  { title: 'Active Reps', value: '11', detail: '5 above quota this week', delta: '+2 active accounts' }
]

const leadStages = [
  { label: 'Qualified', total: 38, fill: 82 },
  { label: 'Discovery', total: 54, fill: 58 },
  { label: 'Proposal', total: 29, fill: 44 },
  { label: 'Negotiation', total: 16, fill: 31 },
  { label: 'Closed Won', total: 13, fill: 15 }
]

const recentEvents = [
  { name: 'Ava Lewis updated Deal #482', when: '17 minutes ago', status: 'Stage moved' },
  { name: 'Outbound call logged for Acme Metals', when: '41 minutes ago', status: 'Activity' },
  { name: 'Invoice sent to North Ridge LLC', when: '1 hour ago', status: 'Sales' }
]

const dataCards = [
  {
    heading: 'Pipeline Snapshot',
    text: 'A quick overview of where opportunities sit before they are closed. Connect Zoho to replace these values with live totals and trend lines.'
  },
  {
    heading: 'Top Signals',
    text: 'Track lead reactivation, stalled deals, and follow-up urgency to direct reps where action is needed most.'
  }
]

function App() {
  const zohoSource = import.meta.env.VITE_ZOHO_SOURCE || 'Not connected yet'

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">Gold CRM Analytics</p>
          <h1>Custom Dashboard</h1>
        </div>
        <span className="pill">Data Source: {zohoSource}</span>
      </header>

      <section className="kpi-grid">
        {kpiStats.map((item) => (
          <article className="kpi-card" key={item.title}>
            <p className="kpi-title">{item.title}</p>
            <p className="kpi-value">{item.value}</p>
            <p className="kpi-detail">{item.detail}</p>
            <p className="kpi-delta">{item.delta}</p>
          </article>
        ))}
      </section>

      <section className="insights-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>Stage Distribution</h2>
            <span>Live from Zoho CRM</span>
          </div>
          <div className="bars">
            {leadStages.map((stage) => (
              <div className="bar-row" key={stage.label}>
                <div className="bar-labels">
                  <span>{stage.label}</span>
                  <strong>{stage.total}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${stage.fill}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Insights</h2>
            <span>Ready for API mapping</span>
          </div>
          <div className="insight-list">
            {dataCards.map((item) => (
              <div className="note-card" key={item.heading}>
                <h3>{item.heading}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="activity">
        <h2>Recent CRM Events</h2>
        <ul>
          {recentEvents.map((event) => (
            <li key={event.name}>
              <p>
                {event.name}
                <span>{event.when}</span>
              </p>
              <strong>{event.status}</strong>
            </li>
          ))}
        </ul>
      </section>

      <footer className="footer">
        Connect Zoho credentials in Vercel environment variables and replace sample metrics with `/api/zoho` endpoint values.
      </footer>
    </div>
  )
}

export default App
