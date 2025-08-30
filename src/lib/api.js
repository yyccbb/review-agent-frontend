const DEFAULT_BASE = 'https://yyccbb-review-agent-server.hf.space'
const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || DEFAULT_BASE


export async function checkHealth() {
    const r = await fetch(`${API_BASE}/health`)
    if (!r.ok) throw new Error(`Health check failed: ${r.status}`)
    return r.json()
}


export async function predict(reviewObj) {
    const r = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review: reviewObj })
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
        throw new Error(data?.detail || `Request failed with ${r.status}`)
    }
    return data
}
