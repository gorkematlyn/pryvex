import { cn } from "@/lib/cn";
import { BrandIcon } from "@/lib/domain/icons";

export interface PreviewLink {
  id: string;
  title: string;
  emoji?: string | null;
  icon?: string | null;
  thumbnail_url?: string | null;
  is_enabled: boolean;
}

export interface PreviewProfile {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

/**
 * Shared visual for the dashboard live preview and the real public page —
 * kept in one component so the two never drift apart.
 */
export function ProfilePreview({
  profile,
  links,
  className,
  linkHrefFor,
}: {
  profile: PreviewProfile;
  links: PreviewLink[];
  className?: string;
  /** Public page passes tracked /go/{id} hrefs; dashboard preview passes "#". */
  linkHrefFor: (link: PreviewLink) => string;
}) {
  const visibleLinks = links.filter((l) => l.is_enabled);

  return (
    <div className={cn("flex flex-col items-center gap-5 px-6 py-10 text-center", className)}>
      <div className="h-20 w-20 overflow-hidden rounded-full border border-border bg-shadow-elevated">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-electric/30 to-ultraviolet/30 text-lg font-semibold text-alloy">
            {(profile.display_name ?? profile.username).slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div>
        <p className="text-base font-semibold text-alloy">{profile.display_name || profile.username}</p>
        <p className="text-sm text-alloy-faint">@{profile.username}</p>
        {profile.bio && <p className="mt-2 max-w-xs text-sm leading-relaxed text-alloy-dim">{profile.bio}</p>}
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {visibleLinks.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-6 text-xs text-alloy-faint">
            No links published yet
          </p>
        )}
        {visibleLinks.map((link) => (
          <a
            key={link.id}
            href={linkHrefFor(link)}
            target={linkHrefFor(link) === "#" ? undefined : "_blank"}
            rel={linkHrefFor(link) === "#" ? undefined : "noopener noreferrer"}
            className="flex items-center gap-3 rounded-xl border border-border bg-shadow-elevated px-4 py-3 text-sm font-medium text-alloy transition-colors hover:border-electric/60 hover:bg-shadow-raised"
          >
            {link.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={link.thumbnail_url} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
            ) : link.emoji ? (
              <span className="text-lg leading-none">{link.emoji}</span>
            ) : link.icon ? (
              <BrandIcon name={link.icon} className="h-5 w-5 shrink-0 text-alloy-dim" />
            ) : null}
            <span className="truncate">{link.title}</span>
          </a>
        ))}
      </div>

      <p className="mt-4 text-[10px] tracking-wide text-alloy-faint">
        <span className="opacity-60">made with</span> <span className="font-semibold text-alloy-dim">Pryvex</span>
      </p>
    </div>
  );
}
