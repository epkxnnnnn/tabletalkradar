export default function SimplePage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>TableTalk Radar - Simple Test</h1>
      <p>If you can see this, the basic deployment is working.</p>
      <p>Time: {new Date().toISOString()}</p>
      <div>
        <h2>Links to test:</h2>
        <ul>
          <li><a href="/api/ping">/api/ping</a></li>
          <li><a href="/api/health">/api/health</a></li>
          <li><a href="/test">/test</a></li>
        </ul>
      </div>
    </div>
  )
}