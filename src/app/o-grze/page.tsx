export default function OGrzePage() {
  return (
    <main className="flex flex-1 justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">O grze</h1>
        <p className="mt-3 text-sm text-foreground">
          Korony Aeldoru to tekstowa gra MMORPG fantasy w przeglądarce.
        </p>

        <h2 className="mt-6 font-display text-base font-bold uppercase tracking-wide text-foreground">Ikony</h2>
        <p className="mt-2 text-sm text-muted">
          Ikony nawigacji pochodzą z zestawu{" "}
          <a href="https://game-icons.net" target="_blank" rel="noreferrer" className="text-accent underline">
            game-icons.net
          </a>{" "}
          na licencji{" "}
          <a
            href="https://creativecommons.org/licenses/by/3.0/"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline"
          >
            CC BY 3.0
          </a>
          , autorstwa:
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted">
          <li>
            Lorc –{" "}
            <a href="https://lorcblog.blogspot.com" target="_blank" rel="noreferrer" className="text-accent underline">
              lorcblog.blogspot.com
            </a>
          </li>
          <li>
            Delapouite –{" "}
            <a href="https://delapouite.com" target="_blank" rel="noreferrer" className="text-accent underline">
              delapouite.com
            </a>
          </li>
        </ul>
      </div>
    </main>
  );
}
