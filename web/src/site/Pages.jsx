import { WorksBest } from "./Legal.jsx";
import shotAnswer from "./img/answer.webp";
import shotHome from "./img/home.webp";
import shotIdk from "./img/idk.webp";
import { useState } from "react";
import { A, LINKEDIN, GITHUB } from "./shared.jsx";
import { EVAL_ROWS, EVAL_DOCS } from "./evalData.js";

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

/* ---------- test numbers: always counted from the graded rows in evalData.js ---------- */
function tally(rows) {
  const ans = rows.filter((r) => r.answerable);
  const count = (g) => ans.filter((r) => r.grade === g).length;
  return {
    asked: rows.length,
    answerable: ans.length,
    c: count("c"),
    p: count("p"),
    w: count("w"),
    unanswerable: rows.length - ans.length,
    refused: rows.filter((r) => !r.answerable && r.grade === "r").length,
    found: ans.filter((r) => r.found).length,
  };
}
const pct = (a, b) => Math.round((a / b) * 100);
const isNew = (r) => !EVAL_DOCS.find((d) => d.key === r.doc).tuned;
const ALL = tally(EVAL_ROWS);
const NEW_PAPERS = tally(EVAL_ROWS.filter(isNew));
const N_NEW = EVAL_DOCS.filter((d) => !d.tuned).length;

/* ---------- HOME ---------- */
export function Home({ go, demo, busy }) {
  return (
    <>
      <section className="st-hero">
        <div className="st-wrap st-hero-in">
          <div>
            <p className="st-eyebrow">Document Q&amp;A you can check</p>
            <h1>Ask your documents. Get the answer, <em>and where it came from.</em></h1>
            <p className="st-lead">
              DocuMind reads your files and answers only from them: PDF, Word, PowerPoint, text, web pages and more.
              If the answer is not there, it says
              {" “"}I don{"’"}t know{"”"} instead of guessing.
            </p>
            <div className="st-cta">
              <button className="st-btn solid big" onClick={demo} disabled={busy}>{busy ? "Opening…" : "Try the demo"}</button>
              <A to="/how-it-works" go={go} className="st-btn ghost big">See how it works</A>
            </div>
            <p className="st-small">Free. No card. A sample document is ready in one click.</p>
          </div>
          <figure className="st-shot">
            <img src={shotAnswer} width="1920" height="931" alt="DocuMind answering a question about a lab manual, with page citations sample p.9 and p.12" />
          </figure>
        </div>
      </section>

      <section className="st-strip">
        <div className="st-wrap st-strip-in">
          <Stat n={`${ALL.found} / ${ALL.answerable}`} l="right passage retrieved in testing" />
          <Stat n={`${ALL.refused} / ${ALL.unanswerable}`} l="unanswerable questions refused" />
          <Stat n={`${pct(ALL.c, ALL.answerable)}%`} l="answers fully correct (hand-graded)" />
        </div>
      </section>

      <section className="st-sec">
        <div className="st-wrap">
          <p className="st-eyebrow">In the app</p>
          <h2>What you will see</h2>
          <div className="st-grid2 st-shots">
            <figure className="st-shotcard">
              <div className="st-shot"><img src={shotIdk} width="1920" height="930" loading="lazy" alt="DocuMind replying that no answer was found in the documents" /></div>
              <figcaption><b>An honest “I don’t know”.</b> Ask something the document does not contain and it says so, instead of making something up.</figcaption>
            </figure>
            <figure className="st-shotcard">
              <div className="st-shot"><img src={shotHome} width="1920" height="933" loading="lazy" alt="DocuMind home screen with a sample document and suggested questions" /></div>
              <figcaption><b>Ready in one click.</b> A sample document is loaded, with suggested questions to try first.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="st-sec">
        <div className="st-wrap">
          <p className="st-eyebrow">Explore</p>
          <h2>Everything you need to know</h2>
          <div className="st-grid3">
            <A to="/features" go={go} className="st-card st-tile">
              <h3>Features</h3>
              <p>Cited answers, honest {"\u201C"}I don{"\u2019"}t know{"\u201D"}, Summarise, many file types and shareable chats.</p>
              <span className="st-tile-link">See what it can do </span>
            </A>
            <A to="/how-it-works" go={go} className="st-card st-tile">
              <h3>How it works</h3>
              <p>The search and answer pipeline behind it, and the tools used to build it.</p>
              <span className="st-tile-link">See the pipeline </span>
            </A>
            <A to="/results" go={go} className="st-card st-tile">
              <h3>Results</h3>
              <p>{`${ALL.asked} real questions on ${EVAL_DOCS.length} documents, graded by hand. Every answer is listed, including the wrong ones.`}</p>
              <span className="st-tile-link">See every question </span>
            </A>
          </div>
        </div>
      </section>
      
      <WorksBest />
      <section className="st-sec">
        <div className="st-wrap st-own">
          <div>
            <p className="st-eyebrow">Your own document</p>
            <h2>Try it with your own file</h2>
                        <p className="st-own-text">Sign up free, upload a file or add a web page link, and ask it anything. See the limits under What works best on the <A to="/features" go={go}>Features page</A>.</p>
          </div>
          <div className="st-cta">
            <button className="st-btn solid big" onClick={() => go("/signup")}>Sign up free</button>
          </div>
        </div>
      </section>


      <section className="st-sec">
        <div className="st-wrap">
          <article className="st-card hl st-public">
            <div>
              <h3>Built in public</h3>
              <p>The code, the test questions and every result, including the wrong answers, are open for anyone to read.</p>
            </div>
            <div className="st-cta">
              <a className="st-btn solid" href={GITHUB} target="_blank" rel="noreferrer">View on GitHub</a>
            </div>
          </article>
        </div>
      </section>

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
        text="Every answer comes with the document and the page, slide or part it was taken from. Hover a citation to read the exact passage, or click it to open a PDF page."
        points={["Citations only list passages the answer actually used", "Works across several documents at once", "Shows which document each answer came from"]}
        visual={<Chat q="Who publishes this lab manual?" chip="sample · p.1"><p>It is published by Malla Reddy College of Engineering &amp; Technology.</p></Chat>}
      />
      <FeatureRow
        flip
        title={"An honest “I don’t know”"}
        text="If your document does not contain the answer, DocuMind says so plainly. It does not fill the gap with a guess."
        points={["Strict prompt: answer only from the retrieved text", "Partial answers are allowed when only part is found", `Tested on questions that have no answer: ${ALL.refused} out of ${ALL.unanswerable} refused`]}
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
        text="Each account sees only its own files plus a shared sample. Share any conversation as a read-only link, and remove the link whenever you like."
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
              ["Many file types", "PDF, Word, PowerPoint, text, web pages by link and more."],
              ["Example questions", "Click a suggested question to see how it works in one tap."],
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
            {i < steps.length - 1 && <i aria-hidden="true" />}
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
        title="From file to cited answer"
        intro="This system is a retrieval-augmented generation (RAG) pipeline: first find the right passages, then let the AI answer from them only."
      />
      <section className="st-sec">
        <div className="st-wrap">
          <Flow
            title="When you upload a File"
            steps={[["Read", "Extract the text by page, slide or part"], ["Split", "1000-character passages, 150 overlap"], ["Tag", "Label Week / Chapter sections"], ["Embed", "Turn each passage into a vector"], ["Store", "Save in the Qdrant database"]]}
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
                  ["File reading", "PyPDFLoader and built-in readers", "PDF pages, slides and parts for citations"],
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

    </>
  );
}

/* ---------- RESULTS ---------- */
const GRADE = { c: ["Correct", "ok"], p: ["Partly", "mid"], w: ["Wrong", "bad"], r: ["Refused", "ok"] };

export function Results({ go, demo, busy }) {
  const [doc, setDoc] = useState("all");
  const [grade, setGrade] = useState("all");
  const inDoc = EVAL_ROWS.filter((r) => doc === "all" || r.doc === doc);
  const rows = inDoc.filter((r) => grade === "all" || r.grade === grade || (grade === "c" && r.grade === "r"));
  const perDoc = [
    ...EVAL_DOCS.map((d) => [d.name + (d.tuned ? " (used while building)" : " (new)"), tally(EVAL_ROWS.filter((r) => r.doc === d.key))]),
    [`The ${N_NEW} new papers together`, NEW_PAPERS],
    ["All documents", ALL],
  ];
  return (
    <>
      <PageHead
        eyebrow="Results"
        title="Tested on real documents. Graded by hand."
        intro={`${ALL.asked} questions on ${EVAL_DOCS.length} documents: a Deep Learning lab manual and two research papers. ${ALL.answerable} can be answered from the document and ${ALL.unanswerable} cannot. Every question, answer and grade is listed below, including the mistakes.`}
      />
      <section className="st-sec">
        <div className="st-wrap">
          <div className="st-stats">
            <Stat n={`${ALL.c} / ${ALL.answerable}`} l={`fully correct (${pct(ALL.c, ALL.answerable)}%)`} />
            <Stat n={`${NEW_PAPERS.c} / ${NEW_PAPERS.answerable}`} l={`fully correct on the ${N_NEW} new papers (${pct(NEW_PAPERS.c, NEW_PAPERS.answerable)}%)`} />
            <Stat n={`${ALL.refused} / ${ALL.unanswerable}`} l="unanswerable questions correctly refused" />
            <Stat n={`${ALL.found} / ${ALL.answerable}`} l="right passage retrieved (it held the answer text)" />
          </div>
          <p className="st-note">
            {`Counting partly correct answers, ${ALL.c + ALL.p} of ${ALL.answerable} are at least partly right. `}
            The lab manual questions were used while building DocuMind, so that row is not a fair test. The two papers were new to
            the system. Each question was asked once with Groq gpt-oss-20b and no backup model. Gemini was graded on the lab manual
            only, in an earlier round (20 of 25 fully correct), and was not run again.
          </p>
          <div className="st-tablewrap">
            <table className="st-table">
              <thead>
                <tr><th>Document</th><th>Fully correct</th><th>Partly</th><th>Wrong</th><th>Refused correctly</th><th>Right passage retrieved</th></tr>
              </thead>
              <tbody>
                {perDoc.map(([name, t]) => (
                  <tr key={name}>
                    <td><b>{name}</b></td>
                    <td>{t.c} / {t.answerable} ({pct(t.c, t.answerable)}%)</td>
                    <td>{t.p}</td>
                    <td>{t.w}</td>
                    <td>{t.refused} / {t.unanswerable}</td>
                    <td>{t.found} / {t.answerable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="st-sec alt">
        <div className="st-wrap">
          <h2>Every question</h2>
          <div className="st-filters">
            {[["all", "All documents"], ...EVAL_DOCS.map((d) => [d.key, d.name])].map(([k, t]) => (
              <button key={k} className={doc === k ? "on" : ""} onClick={() => setDoc(k)}>{t}</button>
            ))}
          </div>
          <div className="st-filters">
            {[["all", `All ${inDoc.length}`], ["c", "Correct"], ["p", "Partly"], ["w", "Wrong"]].map(([k, t]) => (
              <button key={k} className={grade === k ? "on" : ""} onClick={() => setGrade(k)}>{t}</button>
            ))}
            <span className="st-small">Every answer shown is from the Groq run.</span>
          </div>
          <div className="st-tablewrap">
            <table className="st-table st-eval">
              <thead><tr><th>#</th><th>Question</th><th>Expected</th><th>DocuMind said</th><th>Grade</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td><td>{r.q}</td><td>{r.expected}</td>
                    <td>
                      <div style={{ whiteSpace: "pre-line" }}>{r.said}</div>
                      {r.note && <div className="st-small">{r.note}</div>}
                    </td>
                    <td><span className={`st-badge ${GRADE[r.grade][1]}`}>{GRADE[r.grade][0]}</span></td>
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
            <article className="st-card"><h3>Facts found but not used</h3><p>In 4 lab manual answers the right text was among the retrieved passages, yet the answer said the fact was not given. Examples are the epoch counts and the final layers of the VGG16 program.</p></article>
            <article className="st-card"><h3>Passage not retrieved</h3><p>For 3 of {ALL.answerable} questions the passage with the answer was not retrieved: the full lab index (16 programs), a Discussion paragraph in the YOLO paper and the future-work sentence in the UAV paper. Those answers were wrong or half wrong.</p></article>
            <article className="st-card"><h3>Small test</h3><p>{`${EVAL_DOCS.length} documents and ${ALL.asked} questions, each asked once. The questions were written once from the document text. Good for finding weaknesses, not a formal benchmark. Grading is a judgement call, which is why every answer and note is listed.`}</p></article>
          </div>
          <p className="st-more"><a href={GITHUB} target="_blank" rel="noreferrer">Run the evaluation yourself on GitHub </a></p>
        </div>
      </section>
      
    </>
  );
}

/* ---------- PRICING ---------- */
export function Pricing({ go, demo, busy }) {
  const faq = [
    ["Is it really free?", "Yes. DocuMind is a portfolio project that runs on free tiers, so there are no paid plans. The limits exist to keep it available for everyone."],
    ["Are my documents private?", "Your uploaded files are visible only to your account. Only the shared sample is visible to everyone. Please still avoid uploading confidential documents."],
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
            <button className="st-btn ghost" onClick={() => go("/signup")}>Sign up</button>
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
              <li>{`Honest evaluation: ${ALL.asked} hand-graded questions, every answer published`}</li>
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
      
    </>
  );
}

/* ---------- CONTACT ---------- */
export function Contact() {
  return (
    <>
      <PageHead eyebrow="Contact" title={"Let’s talk"} intro="Questions, feedback, or an opportunity? I would love to hear from you." />
      <section className="st-sec">
        <div className="st-wrap st-grid2">
          <article className="st-card">
            <h3>Email</h3>
            <p>For opportunities, questions or feedback.</p>
            <a className="st-btn solid" href="mailto:navedmoghalpathan@proton.me">navedmoghalpathan@proton.me</a>
          </article>
          <article className="st-card">
            <h3>LinkedIn</h3>
            <p>Connect with me and see what I am working on next.</p>
            <a className="st-btn ghost" href={LINKEDIN} target="_blank" rel="noreferrer">Message me</a>
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
