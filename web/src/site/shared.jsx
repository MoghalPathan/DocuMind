export const LINKEDIN = "https://www.linkedin.com/in/naved-korabu-2b8221434/";
export const GITHUB = "https://github.com/MoghalPathan/DocuMind";


// Link that changes the page without reloading
export function A({ to, go, className, children, onClick }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        if (onClick) onClick();
        go(to);
      }}
    >
      {children}
    </a>
  );
}

