const RELEASES = [
  {
    when: "November 2026",
    title: "Summarise and account tools",
    items: [
      "Answers appear word by word as they are written",
      "Hover a page chip to see the exact passage the answer used",
      "More file types: Word, ODT, RTF, PowerPoint, EPUB, email, subtitles, HTML, JSON, XML, text, Markdown and code",
      "Add a public web page by its link",
      "Summarise button: a short summary of a whole PDF with page references",
      "Forgot password by email",
      "Delete my account, with all your files removed",
      "Demo accounts and their files are cleaned up automatically after 48 hours",
      "Privacy and Terms pages, a 404 page and a link preview card for sharing",
      "Security headers and uptime monitoring",
    ],
  },
  {
    when: "October 2026",
    title: "First public version",
    items: [
      "Upload PDFs and ask questions, with the document and page cited in every answer",
      "Strict answers: only from your documents, otherwise \"I don't know\"",
      "Follow-up questions and regenerate",
      "Sign in, Try demo accounts, per-user documents, upload and rate limits",
      "Groq and Gemini, with automatic backup if one is busy",
      "Light and dark theme, mobile layout, voice input",
      "Tested on 30 questions: the right page was found every time",
    ],
  },
];

export function Changelog() {
  return (
    <>
      <section className="st-pagehead">
        <div className="st-wrap">
          <p className="st-eyebrow">Project</p>
          <h1>Changelog</h1>
          <p className="st-intro">What changed in DocuMind, newest first.</p>
        </div>
      </section>
      <section className="st-sec">
        <div className="st-wrap st-changelog">
          {RELEASES.map((r) => (
            <article key={r.title} className="st-change">
              <time>{r.when}</time>
              <div>
                <h2>{r.title}</h2>
                <ul>
                  {r.items.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
