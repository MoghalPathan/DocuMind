import { useState } from 'react'
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
        <button className="upload-btn">+ Upload PDF</button>

        <div>
          <div className="section-title">Documents</div>
          <div className="item">Lab Manual.pdf<small>114 chunks</small></div>
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