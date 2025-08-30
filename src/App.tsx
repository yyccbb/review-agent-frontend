import React, { useMemo, useState } from 'react'

const EXAMPLE = {
    "user_id": "112641626927833880743",
    "name": "Little Man",
    "time": 1533121309821,
    "rating": 3,
    "text": "Has nice food choices.",
    "pics": [
        {"url": ["https://lh5.googleusercontent.com/p/AF1QipMDSa1pSffRzM1AqS0phG3a_K2eSssz-vRY-cPf=w150-h150-k-no-p"]},
        {"url": ["https://lh5.googleusercontent.com/p/AF1QipPgm5LcNt7zGDDb24vS8ST5Oe5SoWkjg6bn7vXN=w150-h150-k-no-p"]}
    ],
    "resp": null,
    "gmap_id": "0x89c2605ade02a307:0x798d440705b8d9b3"
}

export default function App() {
    const [raw, setRaw] = useState(JSON.stringify(EXAMPLE, null, 2))
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const apiUrl = useMemo(() => {
        const url = import.meta.env.VITE_API_URL as string | undefined
        return (url?.endsWith('/') ? url.slice(0, -1) : url) || ''
    }, [])

    async function submit() {
        setError(null)
        setResult(null)
        let review: any
        try {
            review = JSON.parse(raw)
        } catch (e:any) {
            setError(`Invalid JSON: ${e?.message || e}`)
            return
        }
        if (!apiUrl) {
            setError("VITE_API_URL is not set. Configure it in the Space Variables.")
            return
        }
        setLoading(true)
        try {
            const resp = await fetch(`${apiUrl}/predict`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ review }),
            })
            if (!resp.ok) {
                const txt = await resp.text()
                throw new Error(`HTTP ${resp.status}: ${txt}`)
            }
            const data = await resp.json()
            setResult(data)
        } catch (e:any) {
            setError(e?.message || String(e))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{maxWidth: 960, margin: '40px auto', padding: 16, fontFamily: 'system-ui, Arial, sans-serif'}}>
            <h1>Review Relevance Judge</h1>
            <p>Paste a single Google-Maps review JSON object and click <b>Judge</b>.</p>

            <label htmlFor="json" style={{display:'block', marginTop: 16, fontWeight: 600}}>Review JSON</label>
            <textarea
                id="json"
                value={raw}
                onChange={e => setRaw(e.target.value)}
                style={{width:'100%', height: 260, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'}}
            />

            <div style={{marginTop: 12, display:'flex', gap: 12}}>
                <button onClick={submit} disabled={loading} style={{padding: '8px 14px', fontWeight: 600}}>
                    {loading ? 'Judging…' : 'Judge'}
                </button>
                <button onClick={() => setRaw(JSON.stringify(EXAMPLE, null, 2))} disabled={loading}>Load Example</button>
            </div>

            {error && <pre style={{marginTop:16, color:'#b00020', whiteSpace:'pre-wrap'}}>{error}</pre>}

            {result && (
                <div style={{marginTop:24, padding:16, border:'1px solid #ddd', borderRadius:8}}>
                    <h3>Result</h3>
                    <p><b>Model:</b> {result.model}</p>
                    <p><b>Final:</b> {result.final_decision}</p>
                    <p><b>Confidence:</b> {result.confidence}</p>
                    <p><b>Explanation:</b> {result.explanation}</p>
                    <details style={{marginTop:8}}>
                        <summary>Features</summary>
                        <pre>{JSON.stringify(result.features, null, 2)}</pre>
                    </details>
                    <details>
                        <summary>LLM Vote</summary>
                        <pre>{JSON.stringify(result.llm_vote, null, 2)}</pre>
                    </details>
                </div>
            )}
        </div>
    )
}
