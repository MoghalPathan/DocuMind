import { A } from "./shared.jsx";

const MAIL = "navedmoghalpathan@proton.me";

function Head({ eyebrow, title, intro }) {
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

export function Privacy({ go }) {
  return (
    <>
      <Head eyebrow="Privacy" title="Privacy, in plain words" intro="DocuMind is a portfolio project run by one person. Here is exactly what happens to your data. Last updated 1 November 2026." />
      <section className="st-sec">
        <div className="st-wrap st-prose">
          <h3>What I store</h3>
          <ul>
            <li><b>Account:</b> your email and a hashed password (never the password itself). Demo users get a temporary guest account with no email.</li>
            <li><b>Your PDFs:</b> the file, and its text split into small pieces so it can be searched.</li>
            <li><b>Feedback:</b> if you press 👍 or 👎, the question, the answer and your rating are saved.</li>
            <li><b>Answer cache and share links:</b> answers about the sample document may be reused. A share link stores the chat you chose to share.</li>
            <li><b>Server logs:</b> your IP address is seen by the server to limit abuse (for example too many questions per hour).</li>
          </ul>
          <h3>Who else sees your text</h3>
          <p>To answer a question, the matching passages from your PDF and your question are sent to an AI provider: <b>Groq</b> first, and <b>Google Gemini</b> as a backup. Their own privacy terms apply to that text. On Google&rsquo;s free tier, content may be used to improve their products.</p>
          <p><b>So please do not upload private, confidential or sensitive documents.</b> Use public or sample files.</p>
          <h3>What I do not do</h3>
          <ul>
            <li>I do not sell your data or show ads.</li>
            <li>I do not use advertising trackers or analytics cookies.</li>
            <li>Your browser keeps a login token and your theme choice. That is all.</li>
          </ul>
          <h3>Deleting your data</h3>
          <p>Inside the app you can delete any document you uploaded. To delete your whole account and everything linked to it, email <a href={"mailto:" + MAIL}>{MAIL}</a> and I will remove it.</p>
          <p>Questions? <A to="/contact" go={go}>See the Contact page</A>.</p>
        </div>
      </section>
    </>
  );
}

export function Terms() {
  return (
    <>
      <Head eyebrow="Terms" title="Terms of use" intro="Short and honest. Last updated 1 November 2026." />
      <section className="st-sec">
        <div className="st-wrap st-prose">
          <h3>What this is</h3>
          <p>DocuMind is a free portfolio and learning project. It runs on a small server and can be slow, limited or offline at any time.</p>
          <h3>Answers can be wrong</h3>
          <p>DocuMind tries to answer only from your document and to say &ldquo;I don&rsquo;t know&rdquo; otherwise, but it is not perfect. My own test shows it still makes mistakes, especially when counting long lists. Always check the cited page before relying on an answer. Do not use it for medical, legal, financial or other important decisions.</p>
          <h3>Your files</h3>
          <ul>
            <li>Only upload files you have the right to use.</li>
            <li>Do not upload private, confidential or illegal content.</li>
            <li>You keep ownership of your files. I only process them to answer your questions.</li>
          </ul>
          <h3>Fair use</h3>
          <p>There are limits on questions, uploads and file size. Please do not try to bypass them, attack the service or overload it. I may remove accounts or files that do, and I may change or shut down the service without notice.</p>
          <h3>No warranty</h3>
          <p>The service is provided &ldquo;as is&rdquo;, without any promise of accuracy, availability or fitness for a purpose. Use it at your own risk.</p>
          <p>Questions? Email <a href={"mailto:" + MAIL}>{MAIL}</a>.</p>
        </div>
      </section>
    </>
  );
}

export function WorksBest() {
  return (
    <section className="st-sec">
      <div className="st-wrap">
        <p className="st-eyebrow">Before you upload</p>
        <h2>What works best</h2>
        <div className="st-grid2" style={{ marginTop: 20 }}>
          <article className="st-card hl">
            <h3>Works well</h3>
            <p>PDFs with real, selectable text: manuals, reports, papers, notes, textbooks. Ask about a specific fact, a definition or a section.</p>
          </article>
          <article className="st-card">
            <h3>Not supported</h3>
            <p>Scanned PDFs or photos of pages (no selectable text) are rejected. Other file types such as Word or images are not supported yet.</p>
          </article>
          <article className="st-card">
            <h3>Limits</h3>
            <p>Up to 15 MB and 300 pages per PDF. Demo users can upload 1 document; signed-up users up to 5.</p>
          </article>
          <article className="st-card">
            <h3>Known weak spots</h3>
            <p>Counting items in long lists and reading exact values inside code can be wrong. Check the cited page.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function NotFound({ go }) {
  return (
    <section className="st-pagehead">
      <div className="st-wrap" style={{ textAlign: "center", padding: "60px 0" }}>
        <p className="st-eyebrow">404</p>
        <h1>This page doesn&rsquo;t exist</h1>
        <p className="st-intro" style={{ margin: "12px auto 24px" }}>Like a question that isn&rsquo;t in the document: I don&rsquo;t know that one.</p>
        <A to="/" go={go} className="st-btn solid big">Back to home</A>
      </div>
    </section>
  );
}
