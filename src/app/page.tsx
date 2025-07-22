export default function Home() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>TableTalk Radar is LIVE! 🚀</h1>
      <p>Deployment successful - {new Date().toISOString()}</p>
      <p><a href="/hello">Test Hello Page</a></p>
      <p><a href="/simple">Test Simple Page</a></p>
      <p><a href="/api/ping">Test API Ping</a></p>
    </div>
  )
}