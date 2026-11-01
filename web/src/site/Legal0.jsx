import { A } from "./shared.jsx";

const MAIL = "navedmoghalpathan@proton.me";

function Head({ eyebrow, title, intro, legal }) {
  return (
    <section className={"st-pagehead" + (legal ? " st-legal-head" : "")}>
      <div className="st-wrap">
        <p className="st-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {intro && <p className="st-intro">{intro}</p>}
      </div>
    </section>
  );
}

function Sec({ n, title, children }) {
  return (
    <section className="st-legal-sec">
      <h2><span>{n}</span>{title}</h2>
      {children}
    </section>
  );
}

export function Privacy({ go }) {
  return (
    <>
      <Head legal eyebrow="Legal" title="Privacy Policy" intro="Effective 1 November 2026. This explains what DocuMind collects, why, and who can see it." />
      <section className="st-sec st-legal">
        <div className="st-wrap st-legal-in">
          <p className="st-legal-note">DocuMind is a portfolio project operated by Naved Korabu (Pune, India). It is a demonstration, not a commercial service. Please do not upload private, confidential or sensitive documents.</p>

          <Sec n="1" title="Information we collect">
            <table className="st-legal-table">
              <thead><tr><th>Data</th><th>Purpose</th></tr></thead>
              <tbody>
                <tr><td>Email address and password (stored as a salted hash)</td><td>Account sign-in. Demo guests get a temporary account with no email.</td></tr>
                <tr><td>Uploaded PDF files and the text extracted from them</td><td>Searching the document to answer your questions.</td></tr>
                <tr><td>Your questions and the answers given</td><td>Producing answers. Saved in your chat history in your browser, and in feedback if you rate an answer.</td></tr>
                <tr><td>Answer ratings (question, answer, rating)</td><td>Improving answer quality.</td></tr>
                <tr><td>Shared chats, only when you create a share link</td><td>Showing the chat to anyone who has the link.</td></tr>
                <tr><td>IP address and request logs</td><td>Rate limiting and abuse prevention.</td></tr>
              </tbody>
            </table>
          </Sec>

          <Sec n="2" title="Third-party AI providers">
            <p>To answer a question, DocuMind sends your question and the most relevant passages of your document to an AI provider: <b>Groq</b> as the primary provider and <b>Google Gemini</b> as a fallback. Their own terms and privacy policies apply to that content. Under Google&rsquo;s free tier, submitted content may be used to improve Google products.</p>
          </Sec>

          <Sec n="3" title="Cookies and tracking">
            <p>DocuMind does not use advertising cookies, analytics or third-party trackers. Your browser stores a sign-in token and your light or dark theme choice, which are needed for the site to work.</p>
          </Sec>

          <Sec n="4" title="Sharing">
            <p>We do not sell your data or share it with anyone except the providers in section 2 and our hosting provider (Amazon Web Services). Share links you create are readable by anyone who has the link until you remove them.</p>
          </Sec>

          <Sec n="5" title="Retention and deletion">
            <p>You can delete any document you uploaded from inside the app, which removes the file and its searchable text. Demo guest accounts expire after 24 hours. To delete your account and all linked data, email <a href={"mailto:" + MAIL}>{MAIL}</a>.</p>
          </Sec>

          <Sec n="6" title="Security">
            <p>Connections use HTTPS and passwords are hashed. No online service can promise perfect security, and this is a small project, so please keep sensitive files out of it.</p>
          </Sec>

          <Sec n="7" title="Contact and changes">
            <p>Questions about this policy: <a href={"mailto:" + MAIL}>{MAIL}</a>. If this policy changes, the effective date above will be updated.</p>
          </Sec>
        </div>
      </section>
    </>
  );
}

export function Terms({ go }) {
  return (
    <>
      <Head legal eyebrow="Legal" title="Terms of Use" intro="Effective 1 November 2026. By using DocuMind you agree to these terms." />
      <section className="st-sec st-legal">
        <div className="st-wrap st-legal-in">
          <Sec n="1" title="The service">
            <p>DocuMind is a free portfolio and learning project that answers questions about PDF files you upload. It runs on limited infrastructure and may be slow, restricted or unavailable at any time. Features, limits and availability may change or end without notice.</p>
          </Sec>

          <Sec n="2" title="Accuracy of answers">
            <p>DocuMind answers only from your document and says &ldquo;I don&rsquo;t know&rdquo; when it cannot find an answer, but it can still be wrong. Published test results on the Results page show errors, especially when counting items in long lists. Verify important answers against the cited page. Do not rely on DocuMind for medical, legal, financial or safety decisions.</p>
          </Sec>

          <Sec n="3" title="Your content">
            <p>You keep ownership of the files you upload. You confirm that you have the right to upload them and that they are not illegal, confidential or private. You grant DocuMind permission to process them only to provide the service, including sending excerpts to the AI providers described in the Privacy Policy.</p>
          </Sec>

          <Sec n="4" title="Acceptable use">
            <p>Do not attempt to bypass usage limits, probe or attack the service, overload it, or use it to process unlawful content. Accounts or files that break these rules may be removed without notice.</p>
          </Sec>

          <Sec n="5" title="Disclaimer and liability">
            <p>The service is provided &ldquo;as is&rdquo; without warranties of any kind. To the extent permitted by law, the operator is not liable for any loss arising from use of, or inability to use, the service.</p>
          </Sec>

          <Sec n="6" title="Contact">
            <p>Questions: <a href={"mailto:" + MAIL}>{MAIL}</a>. See also the <A to="/privacy" go={go}>Privacy Policy</A>.</p>
          </Sec>
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
