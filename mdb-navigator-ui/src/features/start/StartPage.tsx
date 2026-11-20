import { Link, useSearchParams } from "react-router";
import useAuth from "../../contexts/auth/useAuth";
import { buttonClass } from "../../ui/common/controlStyles";
import { ButtonType } from "../../ui/common/ButtonType.enum";
import { START_PAGE_VIDEO } from "./startPageMedia";

const GITHUB_URL = 'https://github.com/KalliMan/MDBNavigator';

const FEATURES = [
  { title: 'Streamed results', text: 'The first rows of a million-row result show at once; cancel at any time.' },
  { title: 'Schema browser', text: 'Databases, tables, views, functions and procedures, with generated scripts.' },
  { title: 'Editor and grid', text: 'SQL highlighting, one tab per query; sort, filter, copy and export results.' },
  { title: 'Open source', text: 'ASP.NET Core, React and PostgreSQL, under the Apache 2.0 licence.' },
];

// "/" for anyone who isn't signed in, when the demo is on (see Root): what MDBNavigator is, for visitors who won't sign
// up. Open to everyone; only a link with ?code=... gets the "Try the demo" button. The code is not checked here, only
// when the join form is sent (DemoJoinPage), so this page gives nobody a way to test codes without a CAPTCHA.
// Images and video are served by the app itself: the Content Security Policy allows no other source.
export default function StartPage() {
  const { settings } = useAuth();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code')?.trim() || null;
  const minutes = settings?.demo?.sessionMinutes ?? 10;

  return (
    <div className="min-h-screen bg-surface text-fg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-8 w-8" />
          <span className="text-lg font-semibold">MDBNavigator</span>
        </div>
        <Link to="/login" className="text-sm font-medium text-accent-strong hover:underline">Sign in</Link>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-10 px-4 pb-12">
        <section className="grid justify-items-center gap-4 pt-6 text-center sm:pt-10">
          <h1 className="text-3xl font-semibold sm:text-4xl">A database client in your browser</h1>
          <p className="max-w-2xl text-fg-muted">
            Connect to a server, browse its databases, and run SQL with results that stream in while the query runs.
            Nothing to install.
          </p>
          {code ? (
            <>
              <Link to={`/demo?code=${encodeURIComponent(code)}`} className={buttonClass(ButtonType.primary, 'lg')}>
                Try the demo
              </Link>
              <p className="text-sm text-fg-muted">
                Free: a {minutes}-minute session with a sample PostgreSQL database. You get a sign-in link by email.
              </p>
            </>
          ) : (
            <p className="text-sm text-fg-muted">The demo is by invitation: open the link you were given.</p>
          )}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={buttonClass(ButtonType.secondary, 'lg')}>
            View on GitHub
          </a>
          <p className="text-sm text-fg-muted">
            Been here before?{' '}
            <Link to="/demo/sign-in" className="font-medium text-accent-strong hover:underline">Get a new link</Link>
          </p>
        </section>

        <section>
          {START_PAGE_VIDEO ? (
            <video
              controls muted playsInline preload="metadata"
              src={START_PAGE_VIDEO.src}
              poster={START_PAGE_VIDEO.poster}
              className="w-full rounded-md border border-line"
            />
          ) : (
            <img
              src="/start/app.png"
              alt="MDBNavigator with a query and its streamed result"
              width={2556}
              height={1228}
              className="h-auto w-full rounded-md border border-line"
            />
          )}
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map(feature => (
            <div key={feature.title}>
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="text-sm text-fg-muted">{feature.text}</p>
            </div>
          ))}
        </section>

        <figure className="grid justify-items-center gap-2">
          <img
            src="/start/connection.png"
            alt="The saved connections dialog"
            width={807}
            height={565}
            className="h-auto w-full max-w-xl rounded-md border border-line"
          />
          <figcaption className="text-sm text-fg-muted">Saved connections, with passwords kept on the server.</figcaption>
        </figure>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 pb-8 text-center text-sm text-fg-muted">
        MDBNavigator · open source ·{' '}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>
      </footer>
    </div>
  );
}
