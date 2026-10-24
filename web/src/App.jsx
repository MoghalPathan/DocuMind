import { useRef, useState } from 'react'
import './App.css'

const EXAMPLES = [
  'What CPU and how much RAM do the lab systems have?',
  'How early should students arrive at the lab?',
  'Which callbacks does the Week-12 VGG16 program use?',
]

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)  
  

  async function send(text) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setMessages((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setLoading(true)
    try {
      const r = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ question: q }),
      })
      if (!r.ok) throw new Error('Server error ' + r.status)
      const data = await r.json() 
      setMessages((m) => [...m, { role: 'bot', text: data.answer, sources: data.sources }]) 
    } catch (e) {
      setMessages((m) => [...m, {role: 'bot', text: 'Something went wrong: ' + e.message }])
    } finally {
      setLoading(false)
    }
  }

  async function upload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const r = await fetch('/ingest', { method: 'POST', body: form })
      if (!r.ok) throw new Error('Server error ' + r.status)
      const data = await r.json()
      setDocs((d) => [...d.filter((x) => x.name !== data.file), { name: data.file, chunks: data.chunks }])  
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="logo">D</div>DocuMind</div>
        <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={upload} />
        <button className="upload-btn" onClick={() => fileRef.current.click()} disabled={uploading}>
          {uploading ? 'Processing…' : '+ Upload PDF'}
        </button>

        <div>
          <div className="section-title">Documents</div>
          {docs.length === 0 && <div className="recent">No documents yet</div>}
          {docs.map((d) => (
            <div className="item" key={d.name}>{d.name}<small>{d.chunks} chunks</small></div>
          ))}
        </div>

        <div>
          <div className="section-title">Recent questions</div>
          {messages.filter((m) => m.role === 'user').slice(-5).map((m, i) => (
            <div className="recent" key={i}>{m.text}</div>
          ))}
        </div>
      </aside>

      <main className="main">
        <div className="header">
          <div className="badge">Groq · gpt-oss-20b</div>
        </div>

        <div className="chat">
          <div className="chat-inner">
            <h1>Ask your document</h1>
            <p className="sub">Answers come only from your PDF, with source pages.</p>
            <div className="chips">
              <span className="chip">Re-ranked</span>
              <span className="chip">Cited sources</span>
              <span className="chip">Grounded answers</span>
            </div>

            {messages.length === 0 ? (
              <div className="empty">
                No messages yet. Try one of these:
                <div className="examples">
                  {EXAMPLES.map((q) => (
                    <button className="example" key={q} onClick={() => send(q)}>{q}</button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div className="msg" key={i}>
                  <div className={`avatar ${m.role}`}>{m.role === 'user' ? 'You' : 'AI'}</div>
                  <div>
                    <div className="bubble">{m.text}</div>
                    {m.sources && (
                      <div className="sources">
                        {m.sources.map((p) => <span className="source" key={p}>Page {p}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="msg">
                <div className="avatar bot">AI</div>
                <div className="bubble">Thinking…</div>
              </div>
            )}
          </div>
        </div>

        <div className="composer">
          <div className="box">
            <textarea
              rows={1}
              placeholder="Ask a question about your document"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button className="send" disabled={!input.trim() || loading} onClick={() => send()}>↑</button>
          </div>
          <div className="hint">Enter to send · Shift+Enter for a new line</div>
        </div>
      </main>
    </div>
  )
}