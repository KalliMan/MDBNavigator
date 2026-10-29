import { externalSignInUrl } from "../../services/authApi";
import ProviderLogo from "./ProviderLogo";

// One button per configured provider, then an "or" divider before the email form. Nothing when none is configured.
// Plain links: signing in with a provider leaves the page (to the provider and back).
export default function ExternalSignInButtons({ providers, returnTo }: { providers: string[]; returnTo: string }) {
  if (providers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid gap-2">
        {providers.map(provider => (
          <a
            key={provider}
            href={externalSignInUrl(provider, returnTo)}
            className="flex items-center justify-center gap-3 rounded border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-50"
          >
            <ProviderLogo provider={provider} />
            Continue with {provider}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-stone-400" aria-hidden="true">
        <span className="h-px flex-1 bg-stone-200" />
        or
        <span className="h-px flex-1 bg-stone-200" />
      </div>
    </>
  );
}
