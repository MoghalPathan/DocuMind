import { A } from "./shared.jsx";

const MAIL = "navedmoghalpathan@proton.me";
const UPDATED = "1 November 2026";

function Layout({ title, intro, summary, sections }) {
  const jump = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <>
      <section className="st-pagehead st-legal-head">
        <div className="st-wrap">
          <p className="st-eyebrow">Legal</p>
          <h1>{title}</h1>
          <p className="st-legal-meta">Effective and last updated: {UPDATED}</p>
          {intro && <p className="st-intro">{intro}</p>}
        </div>
      </section>
      <section className="st-sec st-legal">
        <div className="st-wrap st-legal-grid">
          <nav className="st-legal-toc" aria-label="On this page">
            <b>On this page</b>
            {sections.map((x, i) => (
              <a key={x.id} href={"#" + x.id} onClick={(e) => jump(e, x.id)}>{i + 1}. {x.title}</a>
            ))}
          </nav>
          <div className="st-legal-main">
            {summary && (
              <div className="st-legal-summary">
                {summary.map(([h, t]) => (
                  <div key={h}><b>{h}</b><span>{t}</span></div>
                ))}
              </div>
            )}
            {sections.map((x, i) => (
              <section key={x.id} id={x.id} className="st-legal-sec">
                <h2><span>{i + 1}</span>{x.title}</h2>
                {x.body}
              </section>
            ))}
            <div className="st-legal-contact">
              Questions about this page? Email <a href={"mailto:" + MAIL}>{MAIL}</a>.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function Privacy({ go }) {
  const sections = [
    {
      id: "collect",
      title: "Information we collect",
      body: (
        <>
          <table className="st-legal-table">
            <thead><tr><th>Data</th><th>Why we use it</th></tr></thead>
            <tbody>
              <tr><td>Email and password (stored only as a salted hash)</td><td>To sign you in. Demo guests get a temporary account with no email.</td></tr>
              <tr><td>PDF files you upload and the text extracted from them</td><td>To search the document and answer your questions.</td></tr>
              <tr><td>Your questions and the answers</td><td>To produce answers. Your chat history is kept in your own browser.</td></tr>
              <tr><td>Ratings you give to answers</td><td>To measure and improve answer quality.</td></tr>
              <tr><td>Chats you choose to share</td><td>To show the chat to anyone who has the link.</td></tr>
              <tr><td>IP address and server logs</td><td>To apply usage limits and prevent abuse.</td></tr>
            </tbody>
          </table>
        </>
      ),
    },
    {
      id: "providers",
      title: "Who processes your data",
      body: (
        <>
          <p>To answer a question, DocuMind sends the question and the most relevant passages from your document to an AI provider. Your full file is not sent.</p>
          <table className="st-legal-table">
            <thead><tr><th>Provider</th><th>Role</th></tr></thead>
            <tbody>
              <tr><td>Groq</td><td>Primary AI model that writes the answer.</td></tr>
              <tr><td>Google Gemini</td><td>Backup AI model, used when the primary is unavailable. On Google&rsquo;s free tier, submitted content may be used to improve Google products.</td></tr>
              <tr><td>Amazon Web Services</td><td>Hosts the server where files and account data are stored.</td></tr>
            </tbody>
          </table>
          <p>Each provider&rsquo;s own terms and privacy policy apply to data they receive. We do not sell your data.</p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies and tracking",
      body: <p>DocuMind uses no advertising cookies, analytics or third-party trackers. Your browser stores a sign-in token, your chat history and your light or dark theme choice, only so the site works.</p>,
    },
    {
      id: "sharing",
      title: "Shared links",
      body: <p>A share link shows the chat you chose to share to anyone who has the link, until you remove it. You can stop sharing at any time from the share window in the app.</p>,
    },
    {
      id: "retention",
      title: "Retention and deletion",
      body: (
        <>
          <p>You can delete any document you uploaded from inside the app. To remove your whole account, use Delete account and data at the bottom of the sidebar. This permanently removes your uploaded PDFs, their searchable text, your shared links and the account itself.</p>
          <p>Demo sessions end after 24 hours. Demo accounts and their files are deleted automatically 48 hours after they are created.</p>
          <p>If you cannot log in, email <a href={"mailto:" + MAIL}>{MAIL}</a> and your data will be removed.</p>
        </>
      ),
    },
    {
      id: "security",
      title: "Security",
      body: <p>Connections use HTTPS and passwords are hashed with a salt. No online service is perfectly secure, and DocuMind is a small project, so please do not upload private, confidential or sensitive documents.</p>,
    },
    {
      id: "changes",
      title: "Changes to this policy",
      body: <p>If this policy changes, the date at the top of the page will be updated. Using DocuMind after a change means you accept the updated policy.</p>,
    },
  ];
  return (
    <Layout
      title="Privacy Policy"
      intro="What DocuMind collects, why, and who can see it. DocuMind is a portfolio project operated by Naved Korabu in Pune, India."
      summary={[
        ["We do not sell your data", "No ads and no third-party trackers."],
        ["AI providers see excerpts", "Your question and relevant passages go to Groq or Gemini."],
        ["You can delete", "to Delete your account and files yourself from the app sidebar."],
      ]}
      sections={sections}
    />
  );
}

export function Terms({ go }) {
  const sections = [
    { id: "service", title: "The service", body: <p>DocuMind is a free portfolio and learning project that answers questions about PDF files you upload. It runs on limited infrastructure and may be slow, restricted or unavailable at any time. Features, limits and availability can change or end without notice.</p> },
    { id: "accuracy", title: "Accuracy of answers", body: <p>DocuMind answers only from your document and says &ldquo;I don&rsquo;t know&rdquo; when it cannot find an answer, but it can still be wrong. The published test results show errors, especially when counting items in long lists. Check important answers against the cited page. Do not rely on DocuMind for medical, legal, financial or safety decisions.</p> },
    { id: "content", title: "Your content", body: <p>You keep ownership of the files you upload. You confirm that you have the right to upload them and that they are not illegal, confidential or private. You allow DocuMind to process them only to provide the service, including sending excerpts to the AI providers named in the <A to="/privacy" go={go}>Privacy Policy</A>.</p> },
    { id: "use", title: "Acceptable use", body: <p>Do not try to bypass usage limits, probe or attack the service, overload it, or use it for unlawful content. Accounts or files that break these rules may be removed without notice.</p> },
    { id: "liability", title: "Disclaimer and liability", body: <p>The service is provided &ldquo;as is&rdquo;, without warranties of any kind. To the extent allowed by law, the operator is not liable for any loss that comes from using, or not being able to use, the service.</p> },
    { id: "changes", title: "Changes", body: <p>These terms may be updated. The date at the top shows the latest version. Continuing to use DocuMind means you accept the current terms.</p> },
  ];
  return (
    <Layout
      title="Terms of Use"
      intro="The rules for using DocuMind. By using the service you agree to them."
      summary={[
        ["Free, as-is", "A portfolio project with no guarantee of uptime."],
        ["Verify answers", "Always check the cited page for anything important."],
        ["Your files stay yours", "Only upload files you have the right to use."],
      ]}
      sections={sections}
    />
  );
}

export function WorksBest() {
  return (
    <section className="st-sec">
      <div className="st-wrap">
        <p className="st-eyebrow">Before you upload</p>
        <h2>What works best</h2>
        <div className="st-grid2" style={{ marginTop: 20, maxWidth: "none" }}>
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
