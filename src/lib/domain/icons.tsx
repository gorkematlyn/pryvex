export const ICON_OPTIONS = [
  { value: "", label: "None" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "spotify", label: "Spotify" },
  { value: "website", label: "Website" },
  { value: "email", label: "Email" },
] as const;

const PATHS: Record<string, string> = {
  instagram: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.2-2.2a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
  x: "M3 3l7.5 9.5L3.4 21H6l6-6.8L16.7 21H21l-8-9.9L20 3h-2.6l-5.5 6.2L6.9 3H3Z",
  youtube: "M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15V9l5 3-5 3Z",
  tiktok: "M14 3h3a5 5 0 0 0 5 5v3a8 8 0 0 1-5-1.7V16a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.1a3 3 0 1 0 2 2.8V3Z",
  spotify: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.6.6 0 0 1-.8.2c-2.3-1.4-5.2-1.7-8.6-.9a.6.6 0 1 1-.3-1.2c3.7-.9 6.9-.5 9.5 1.1.3.2.4.6.2.8Zm1.2-2.7a.75.75 0 0 1-1 .3c-2.6-1.6-6.6-2.1-9.7-1.1a.75.75 0 1 1-.5-1.4c3.5-1.1 8-.6 11 1.2.3.2.5.7.2 1Zm.1-2.8C14.6 9 9.5 8.8 6.5 9.7a.9.9 0 1 1-.5-1.7c3.5-1 9.2-.8 12.8 1.3a.9.9 0 0 1-.9 1.6Z",
  website: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0c2.5 2.5 4 5.9 4 10s-1.5 7.5-4 10m0-20C9.5 4.5 8 7.9 8 12s1.5 7.5 4 10M2.5 9h19M2.5 15h19",
  email: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 0 8 7 8-7",
};

export function BrandIcon({ name, className }: { name: string; className?: string }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}
