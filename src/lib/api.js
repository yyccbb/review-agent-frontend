// src/lib/api.js
const API_BASE = (import.meta.env.VITE_API_BASE || 'https://yyccbb-review-agent-server.hf.space').replace(/\/$/, '')

async function readBodyOrStatus(r) {
    const text = await r.text().catch(() => '')
    if (!r.ok) {
        // include server body (e.g., FastAPI traceback) for debugging
        throw new Error(`HTTP ${r.status} ${r.statusText}${text ? `: ${text}` : ''}`)
    }
    return text ? JSON.parse(text) : {}
}

export async function checkHealth() {
    const r = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: { 'accept': 'application/json' },
        cache: 'no-store',
        mode: 'cors'
    })
    return readBodyOrStatus(r)
}

export async function predict(reviewObj) {
    const r = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({ review: reviewObj }),
        mode: 'cors'
    })
    return readBodyOrStatus(r)
}
