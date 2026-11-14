import { externalSignInUrl } from "../../services/authApi";
import { ButtonType } from "../../ui/common/ButtonType.enum";
import { buttonClass } from "../../ui/common/controlStyles";
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
            className={buttonClass(ButtonType.secondary, 'lg', true)}
          >
            <ProviderLogo provider={provider} />
            <span className="ml-1.5">Continue with {provider}</span>
          </a>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-fg-faint" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}
