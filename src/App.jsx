import { useEffect, useMemo, useState } from 'react'
import MessageBubble from './components/MessageBubble.jsx'
import JsonEditor from './components/JsonEditor.jsx'
import { checkHealth, predict } from './lib/api.js'


export default function App() {
    const [jsonText, setJsonText] = useState(null)
    const [messages, setMessages] = useState([])
    const [ready, setReady] = useState(false)
    const [model, setModel] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')


    useEffect(() => {
        (async () => {
            try {
                const h = await checkHealth()
                setReady(true)
                setModel(h?.model || '')
            } catch (e) {
                setError(`${e.message}`)
            }
        })()
    }, [])


    const canSend = useMemo(() => !loading && jsonText?.trim(), [loading, jsonText])


    async function onSend() {
        setError('')


        let obj
        try {
            obj = JSON.parse(jsonText)
            if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) {
                throw new Error('Input must be a single JSON object (not null/array).')
            }
        } catch (e) {
            setError(`JSON parse error: ${e.message}`)
            return
        }


        setMessages((m) => [...m, { who: 'user', content: 'Input Review Object:', json: obj }])
        setLoading(true)
        try {
            const res = await predict(obj)
            setMessages((m) => [
                ...m,
                {
                    who: 'bot',
                    content: `Decision: ${res.final_decision.toUpperCase()} \nConfidence: ${Math.round((res.confidence ?? 0)*100)}% \nModel: ${res.model}`,
                    json: res
                }
            ])
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="container">
            <div className="header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="#22d3ee" strokeWidth="1.4"/></svg>
                <h1>Review Relevance Agent</h1>
            </div>
            <div className="card helper">
                API: <code>{import.meta.env.VITE_API_BASE || 'https://yyccbb-review-agent-server.hf.space'}</code>
                {model && <> · Model: <code>{model}</code></>}
                {!ready && !error && <span> · Checking server…</span>}
                {error && <span className="error"> · {error}</span>}
            </div>


            <div className="row">
                <JsonEditor value={jsonText} onChange={setJsonText} />
            </div>
            <div className="row">
                <button className="button" disabled={!canSend} onClick={onSend}>
                    {loading ? 'Thinking…' : 'Send to /predict'}
                </button>
            </div>


            <div className="card chat">
                {messages.length === 0 && (
                    <div className="status">Responses will appear here. Your input must be a single JSON object (the Google review).</div>
                )}
                {messages.map((m, i) => (
                    <MessageBubble key={i} who={m.who}>
                        <div dangerouslySetInnerHTML={{__html: m.content.replace(/\n/g,'<br/>')}} />
                        {m.json && (
                            <pre className="json mono">{JSON.stringify(m.json, null, 2)}</pre>
                        )}
                    </MessageBubble>
                ))}
            </div>
        </div>
    )
}
