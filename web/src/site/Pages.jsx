import { useState } from "react";
import { A, LINKEDIN, GITHUB } from "./shared.jsx";
import { EVAL_ROWS } from "./evalData.js";

/* ---------- small shared pieces ---------- */
function PageHead({ eyebrow, title, intro }) {
  return (
    <section className="st-pagehead">
      <div className="st-wrap">
        <p className="st-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {intro && <p className="st-intro">{intro}</p>}
      </div>
    </section>
  );
}

function CtaBand({ go, demo, busy }) {
  return (
    <section className="st-band">
      <div className="st-wrap st-band-in">
        <div>
          <h2>See it answer from a real document</h2>
          <p>The demo opens in one click with a sample document already loaded.</p>
        </div>
        <div className="st-cta">
          <button className="st-btn solid big" onClick={demo} disabled={busy}>{busy ? "Opening…" : "Try the demo"}</button>
          <button className="st-btn ghost big" onClick={() => go("/login")}>Log in or sign up</button>
        </div>
      </div>
    </section>
  );
}

function Chat({ q, children, chip, title = "sample.pdf" }) {
  return (
    <div className="st-mock">
      <div className="st-mock-bar"><span /><span /><span /><b>{title}</b></div>
      <div className="st-mock-q">{q}</div>
      <div className="st-mock-a">
        {children}
        {chip && <span className="st-chip">{chip}</span>}
      </div>
    </div>
  );
}

const Stat = ({ n, l }) => (
  <div className="st-stat"><b>{n}</b><span>{l}</span></div>
);

/* ---------- HOME ---------- */
export function Home({ go, demo, busy }) {
  return (
    <>
      <section className="st-hero">
        <div className="st-wrap st-hero-in">
          <div>
            <p className="st-eyebrow">Document Q&amp;A you can check</p>
            <h1>Ask your PDF. Get the answer, <em>and the page it came from.</em></h1>
            <p className="st-lead">
              DocuMind reads your document and answers only from it. If the answer is not there, it says
              {" “"}I don{"’"}t know{"”"} instead of guessing.
            </p>
            <div className="st-cta">
              <button className="st-btn solid big" onClick={demo} disabled={busy}>{busy ? "Opening…" : "Try the demo"}</button>
              <A to="/how-it-works" go={go} className="st-btn ghost big">See how it works</A>
            </div>
            <p className="st-small">Free. No card. A sample document is ready in one click.</p>
          </div>
          <div aria-hidden="true">
            <Chat q="How are the 15 marks for day-to-day evaluation distributed?" chip="sample · p.11">
              <p>The 15 marks are split equally, 3 marks each:</p>
              <ul><li>Regularity</li><li>Program written</li><li>Execution &amp; result</li><li>Viva-voce</li><li>Dress code</li></ul>
            </Chat>
          </div>
        </div>
      </section>

      <section className="st-strip">
        <div className="st-wrap st-strip-in">
          <Stat n="25 / 25" l="right page found in testing" />
          <Stat n="5 / 5" l="unanswerable questions refused" />
          <Stat n="80%" l="answers fully correct (hand-graded)" />
          <A to="/results" go={go} className="st-strip-link">See every question →</A>
        </div>
      </section>

      <section className="st-sec">
        <div className="st-wrap">
          <p className="st-eyebrow">Why DocuMind</p>
          <h2>Built to be trusted, not just fast</h2>
          <div className="st-grid3">
            <article className="st-card">
              <h3>Every answer shows its source</h3>
              <p>Each answer lists the document and page it came from, so you can open the PDF and check it yourself.</p>
            </article>
            <article className="st-card">
              <h3>It admits when it does not know</h3>
              <p>If the answer is not in your document, DocuMind says so. It does not guess or make things up.</p>
            </article>
            <article className="st-card">
              <h3>Tested, with the numbers shown</h3>
              <p>30 real questions, graded by hand, with the wrong answers published too. No vague accuracy claims.</p>
            </article>
          </div>
          <p className="st-more"><A to="/features" go={go}>Explore all features →</A></p>
        </div>
      </section>

      <section className="st-sec alt">
        <div className="st-wrap">
          <p className="st-eyebrow">How it works</p>
          <h2>Four steps from PDF to cited answer</h2>
          <ol className="st-steps">
            {[["Upload", "Add a PDF or use the sample."], ["Index", "Text is split and stored by meaning."], ["Search", "Best passages are found and re-ranked."], ["Answer", "The AI answers only from them, with pages."]].map(([t, d], i) => (
              <li key={t}><span className="st-num">{i + 1}</span><div><h3>{t}</h3><p>{d}</p></div></li>
            ))}
          </ol>
          <p className="st-more"><A to="/how-it-works" go={go}>See the full pipeline →</A></p>
        </div>
      </section>

      <CtaBand go={go} demo={demo} busy={busy} />
    </>
  );
}

/* ---------- FEATURES ---------- */
function FeatureRow({ title, text, points, visual, flip }) {
  return (
    <section className={`st-frow ${flip ? "flip" : ""}`}>
      <div className="st-wrap st-frow-in">
        <div className="st-frow-text">
          <h2>{title}</h2>
          <p>{text}</p>
          <ul>{points.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
        <div aria-hidden="true">{visual}</div>
      </div>
    </section>
  );
}

export function Features({ go, demo, busy }) {
  return (
    <>
      <PageHead
        eyebrow="Features"
        title="Everything you need to trust an answer"
        intro="DocuMind is built around one idea: you should be able to check every answer against your own document."
      />

      <FeatureRow
        title="Answers with page citations"
        text="Every answer comes with the document and page it was taken from. Click a citation to open the PDF."
        points={["Citations only list passages the answer actually used", "Works across several documents at once", "Shows which document each answer came from"]}
        visual={<Chat q="Who publishes this lab manual?" chip="sample · p.1"><p>It is published by Malla Reddy College of Engineering &amp; Technology.</p></Chat>}
      />
      <FeatureRow
        flip
        title={"An honest “I don’t know”"}
        text="If your document does not contain the answer, DocuMind says so plainly. It does not fill the gap with a guess."
        points={["Strict prompt: answer only from the retrieved text", "Partial answers are allowed when only part is found", "Tested on questions that have no answer: 5 out of 5 refused"]}
        visual={<Chat q="Who won the 2018 FIFA World Cup?"><p className="muted">I don{"’"}t know. This is not in the document.</p></Chat>}
      />
      <FeatureRow
        title="Follow-ups and regenerate"
        text={"Ask “what about the second one?” and it understands what you mean. Not happy with an answer? Regenerate it."}
        points={["Remembers the recent conversation", "Regenerate with more detail, shorter, or a different angle", "Rewrites short follow-ups into full questions before searching"]}
        visual={
          <div className="st-mock">
            <div className="st-mock-bar"><span /><span /><span /><b>Conversation</b></div>
            <div className="st-mock-q">Which callbacks does the VGG16 program use?</div>
            <div className="st-mock-a"><p>ModelCheckpoint and EarlyStopping.</p></div>
            <div className="st-mock-q alt">And what is the patience?</div>
            <div className="st-mock-a"><p>EarlyStopping uses patience=20.</p>
              <div className="st-pills"><span>More detail</span><span>Shorter</span><span>Different</span></div></div>
          </div>
        }
      />
      <FeatureRow
        flip
        title="Search that finds the right page"
        text="Finding the right passage matters more than anything else. DocuMind combines several search steps."
        points={["Section match: “Week 7” goes straight to Week 7", "Meaning search over the whole document", "A second model re-ranks the best candidates", "Neighbouring passages added so context is not cut off"]}
        visual={
          <div className="st-mock">
            <div className="st-mock-bar"><span /><span /><span /><b>Search steps</b></div>
            <ol className="st-mini">
              <li>Match section labels</li><li>Search by meaning</li><li>Re-rank the best passages</li><li>Add neighbouring passages</li>
            </ol>
          </div>
        }
      />
      <FeatureRow
        title="Two AI models, one backup"
        text="Choose Groq or Gemini. If your choice is busy, the other takes over quietly so you are never stuck."
        points={["Groq gpt-oss-20b or Gemini flash-lite", "Automatic backup with a short cool-down", "A friendly message if both are busy"]}
        visual={
          <div className="st-mock">
            <div className="st-mock-bar"><span /><span /><span /><b>Choose AI</b></div>
            <div className="st-choice on"><b>Groq</b><small>gpt-oss-20b</small></div>
            <div className="st-choice"><b>Gemini</b><small>flash-lite</small></div>
            <p className="st-small">If one is busy, the other answers.</p>
          </div>
        }
      />
      <FeatureRow
        flip
        title="Private uploads and shareable chats"
        text="Each account sees only its own PDFs plus a shared sample. Share any conversation as a read-only link, and remove the link whenever you like."
        points={["Login, or try the one-click demo", "Your files are never shared, only the messages you choose", "Stop sharing at any time"]}
        visual={
          <div className="st-mock">
            <div className="st-mock-bar"><span /><span /><span /><b>Share conversation</b></div>
            <div className="st-link">documindai.duckdns.org/s/…</div>
            <div className="st-pills"><span>Copy link</span><span>Stop sharing</span></div>
          </div>
        }
      />

      <section className="st-sec alt">
        <div className="st-wrap">
          <h2>And the details</h2>
          <div className="st-grid3">
            {[
              ["Light and dark themes", "Switch any time. Your choice is remembered."],
              ["Works on phones", "A layout designed for small screens."],
              ["Voice input", "Ask with your microphone on a secure connection."],
              ["Scanned PDFs detected", "Image-only PDFs are rejected with a clear message."],
              ["Fair-use limits", "Per-user limits keep the free demo available to everyone."],
              ["Chat history", "Pin, rename, search and archive your chats."],
            ].map(([t, d]) => (
              <article key={t} className="st-card"><h3>{t}</h3><p>{d}</p></article>
            ))}
          </div>
        </div>
      </section>
      <CtaBand go={go} demo={demo} busy={busy} />
    </>
  );
}

/* ---------- HOW IT WORKS ---------- */
function Flow({ title, steps }) {
  return (
    <div className="st-flow">
      <h3>{title}</h3>
      <div className="st-flow-row">
        {steps.map(([t, d], i) => (
          <div key={t} className="st-flow-item">
            <div className="st-flow-box"><span>{i + 1}</span><b>{t}</b><small>{d}</small></div>
            {i < steps.length - 1 && <i aria-hidden="true">→</i>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HowItWorks({ go, demo, busy }) {
  return (
    <>
      <PageHead
        eyebrow="How it works"
        title="From PDF to cited answer"
        intro="This system is a retrieval-augmented generation (RAG) pipeline: first find the right passages, then let the AI answer from them only."
      />
      <section className="st-sec">
        <div className="st-wrap">
          <Flow
            title="When you upload a PDF"
            steps={[["Read", "Extract text page by page"], ["Split", "1000-character passages, 150 overlap"], ["Tag", "Label Week / Chapter sections"], ["Embed", "Turn each passage into a vector"], ["Store", "Save in the Qdrant database"]]}
          />
          <Flow
            title="When you ask a question"
            steps={[["Understand", "Rewrite short follow-ups"], ["Search", "Section match + meaning search"], ["Re-rank", "A second model sorts the best"], ["Answer", "AI answers from the passages only"], ["Cite", "Show the pages that were used"]]}
          />
        </div>
      </section>

      <section className="st-sec alt">
        <div className="st-wrap">
          <h2>What{"’"}s inside</h2>
          <div className="st-tablewrap">
            <table className="st-table">
              <thead><tr><th>Part</th><th>Choice</th><th>Why</th></tr></thead>
              <tbody>
                {[
                  ["PDF reading", "PyPDFLoader", "Keeps page numbers for citations"],
                  ["Splitting", "1000 characters, 150 overlap", "Passages small enough to be precise"],
                  ["Embeddings", "all-MiniLM-L6-v2", "Small, fast, runs on a CPU"],
                  ["Vector database", "Qdrant", "Fast search with filters per user"],
                  ["Re-ranker", "Cross-encoder", "Sorts candidates by how well they answer"],
                  ["AI models", "Groq gpt-oss-20b, Gemini flash-lite", "Free tiers, with a backup for each other"],
                  ["Backend", "FastAPI", "Simple, fast Python API"],
                  ["Frontend", "React", "Chat interface, light and dark themes"],
                  ["Hosting", "AWS EC2, Docker Compose, Caddy", "Automatic https, restarts by itself"],
                ].map((r) => <tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="st-sec">
        <div className="st-wrap">
          <h2>Guardrails</h2>
          <div className="st-grid3">
            <article className="st-card"><h3>Answer only from the text</h3><p>The prompt tells the AI to use the retrieved passages only, and to say {"“"}I don{"’"}t know{"”"} otherwise.</p></article>
            <article className="st-card"><h3>Per-user separation</h3><p>Search is filtered so you only ever see your own uploads and the shared sample.</p></article>
            <article className="st-card"><h3>Limits and a daily cap</h3><p>Per-user limits and a site-wide daily cap keep the free demo working for everyone.</p></article>
          </div>
        </div>
      </section>
      <CtaBand go={go} demo={demo} busy={busy} />
    </>
  );
}

/* ---------- RESULTS ---------- */
const GRADE = { c: ["Correct", "ok"], p: ["Partly", "mid"], w: ["Wrong", "bad"], r: ["Refused", "ok"] };

export function Results({ go, demo, busy }) {
  const [filter, setFilter] = useState("all");
  const rows = EVAL_ROWS.filter((r) => filter === "all" || r.gemini === filter || (filter === "c" && r.gemini === "r"));
  return (
    <>
      <PageHead
        eyebrow="Results"
        title="Tested on real questions. Graded by hand."
        intro="25 answerable and 5 unanswerable questions on a real 16-week Deep Learning lab manual. Every question and every grade is listed below, including the mistakes."
      />
      <section className="st-sec">
        <div className="st-wrap">
          <div className="st-stats">
            <Stat n="25 / 25" l="right page retrieved (both AI models)" />
            <Stat n="5 / 5" l="unanswerable questions correctly refused" />
            <Stat n="19 / 25" l="fully correct with Groq (76%)" />
            <Stat n="20 / 25" l="fully correct with Gemini (80%)" />
          </div>
          <p className="st-note">
            Counting partly correct answers, Groq reaches 22 of 25 and Gemini 23 of 25. This is one document and a small
            set of questions, so treat the numbers as a rough guide, not a benchmark.
          </p>
        </div>
      </section>

      <section className="st-sec alt">
        <div className="st-wrap">
          <h2>Every question</h2>
          <div className="st-filters">
            {[["all", "All 30"], ["c", "Correct"], ["p", "Partly"], ["w", "Wrong"]].map(([k, t]) => (
              <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{t}</button>
            ))}
            <span className="st-small">Answers shown are from the Gemini run.</span>
          </div>
          <div className="st-tablewrap">
            <table className="st-table st-eval">
              <thead><tr><th>#</th><th>Question</th><th>Expected</th><th>DocuMind said</th><th>Groq</th><th>Gemini</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td><td>{r.q}</td><td>{r.expected}</td><td>{r.said}</td>
                    <td><span className={`st-badge ${GRADE[r.groq][1]}`}>{GRADE[r.groq][0]}</span></td>
                    <td><span className={`st-badge ${GRADE[r.gemini][1]}`}>{GRADE[r.gemini][0]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="st-sec">
        <div className="st-wrap">
          <h2>Where it still fails</h2>
          <div className="st-grid3">
            <article className="st-card"><h3>Counting long lists</h3><p>{"“"}How many programs are listed?{"”"} came back as 10 instead of 16, because only part of the list was retrieved.</p></article>
            <article className="st-card"><h3>Exact values inside code</h3><p>Some values, like epoch counts hidden in long code sections, were missed even though the right page was found.</p></article>
            <article className="st-card"><h3>Small test set</h3><p>One document, 30 questions, graded by one person. Good for finding weaknesses, not a formal benchmark.</p></article>
          </div>
          <p className="st-more"><a href={GITHUB} target="_blank" rel="noreferrer">Run the evaluation yourself on GitHub →</a></p>
        </div>
      </section>
      <CtaBand go={go} demo={demo} busy={busy} />
    </>
  );
}

/* ---------- PRICING ---------- */
export function Pricing({ go, demo, busy }) {
  const faq = [
    ["Is it really free?", "Yes. DocuMind is a portfolio project that runs on free tiers, so there are no paid plans. The limits exist to keep it available for everyone."],
    ["Are my documents private?", "Your uploaded PDFs are visible only to your account. Only the shared sample is visible to everyone. Please still avoid uploading confidential documents."],
    ["Which AI sees my text?", "The passages relevant to your question are sent to the AI model you choose (Groq or Gemini). Gemini’s free tier may use content to improve Google products, so choose Groq for anything sensitive."],
    ["Why do I see a limit message?", "Free AI tiers have daily limits. Per-user limits and a site-wide daily cap keep the demo working for everyone. Try again later, or use the cached example questions."],
  ];
  return (
    <>
      <PageHead eyebrow="Pricing" title="Free to use. No paid plans." intro="DocuMind is a portfolio project running on free tiers. Pick the demo for a quick look, or make a free account to keep your chats." />
      <section className="st-sec">
        <div className="st-wrap st-plans">
          <article className="st-card">
            <h3>Demo</h3>
            <p className="st-price">One click</p>
            <ul><li>5 questions per hour</li><li>1 document of your own</li><li>2 uploads per day</li><li>Shared sample document</li></ul>
            <button className="st-btn solid" onClick={demo} disabled={busy}>Try the demo</button>
          </article>
          <article className="st-card hl">
            <h3>Free account</h3>
            <p className="st-price">Email and password</p>
            <ul><li>30 questions per hour</li><li>Up to 5 documents of your own</li><li>7 uploads per day</li><li>Saved chats and share links</li></ul>
            <button className="st-btn ghost" onClick={() => go("/login")}>Sign up</button>
          </article>
        </div>
      </section>
      <section className="st-sec alt">
        <div className="st-wrap st-faq">
          <h2>Questions</h2>
          {faq.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
      </section>
      <CtaBand go={go} demo={demo} busy={busy} />
    </>
  );
}

/* ---------- ABOUT ---------- */
export function About({ go, demo, busy }) {
  return (
    <>
      <PageHead eyebrow="About" title="Built by Naved Korabu" intro="A computer engineering graduate from Pune. DocuMind is my first retrieval-augmented generation (RAG) project." />
      <section className="st-sec">
        <div className="st-wrap st-about">
          <div>
            <h2>Why I built it</h2>
            <p className="st-body">
              I wanted to understand how document question-answering really works, and not only wire up an API. So I built
              each part myself: the search, the answer checking, the login, the limits and the deployment. Then I measured
              the quality with real questions and published the results, including the mistakes.
            </p>
            <h2>What it shows</h2>
            <ul className="st-checks">
              <li>Retrieval and re-ranking for better answers</li>
              <li>Honest evaluation with hand-graded questions</li>
              <li>Authentication, rate limits and per-user data separation</li>
              <li>Deployment on AWS with Docker, https and automatic restarts</li>
            </ul>
          </div>
          <aside className="st-card">
            <h3>Built with</h3>
            <div className="st-tags">
              {["Python", "FastAPI", "Qdrant", "sentence-transformers", "Groq", "Gemini", "React", "Docker", "AWS", "Caddy"].map((t) => <span key={t}>{t}</span>)}
            </div>
            <div className="st-cta" style={{ marginTop: 18 }}>
              <a className="st-btn solid" href={LINKEDIN} target="_blank" rel="noreferrer">LinkedIn</a>
              <a className="st-btn ghost" href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </aside>
        </div>
      </section>
      <CtaBand go={go} demo={demo} busy={busy} />
    </>
  );
}

/* ---------- CONTACT ---------- */
export function Contact() {
  return (
    <>
      <PageHead eyebrow="Contact" title={"Let’s talk"} intro="Questions, feedback, or an opportunity? I would love to hear from you." />
      <section className="st-sec">
        <div className="st-wrap st-grid3">
          <article className="st-card">
            <h3>LinkedIn</h3>
            <p>The best way to reach me, and to see what I am working on next.</p>
            <a className="st-btn solid" href={LINKEDIN} target="_blank" rel="noreferrer">Message me</a>
          </article>
          <article className="st-card">
            <h3>GitHub</h3>
            <p>Read the code, the evaluation scripts and the README.</p>
            <a className="st-btn ghost" href={GITHUB} target="_blank" rel="noreferrer">View the repository</a>
          </article>
          <article className="st-card">
            <h3>Found a problem?</h3>
            <p>Open an issue and tell me what happened. It helps a lot.</p>
            <a className="st-btn ghost" href={GITHUB + "/issues"} target="_blank" rel="noreferrer">Report an issue</a>
          </article>
        </div>
      </section>
    </>
  );
}
