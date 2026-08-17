import { ImageResponse } from "next/og";
import { getProfileByUsername } from "@/lib/repo/profiles";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  const displayName = profile?.display_name || profile?.username || username;
  const handle = `@${profile?.username || username}`;
  const bio = profile?.bio ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0C0D11",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 0%, rgba(100,160,255,0.18), transparent 55%)",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 84, fontWeight: 800, color: "#D7DCE4" }}>
          <span>Pr</span>
          <svg width="66" height="66" viewBox="0 0 48 48" fill="none">
            <path d="M4 4 L21 21" stroke="#64A0FF" strokeWidth="7" strokeLinecap="round" />
            <path d="M27 27 L44 44" stroke="#B998FF" strokeWidth="7" strokeLinecap="round" />
            <path d="M44 4 L27 21" stroke="#D7DCE4" strokeWidth="7" strokeLinecap="round" />
            <path d="M21 27 L4 44" stroke="#D7DCE4" strokeWidth="7" strokeLinecap="round" />
          </svg>
          <span>vex</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 56 }}>
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              width={120}
              height={120}
              style={{ borderRadius: "50%", border: "2px solid #24262f", objectFit: "cover" }}
              alt=""
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                fontWeight: 700,
                color: "#D7DCE4",
                background: "linear-gradient(135deg, rgba(100,160,255,0.35), rgba(185,152,255,0.35))",
              }}
            >
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#D7DCE4", marginTop: 28 }}>{displayName}</div>
          <div style={{ display: "flex", fontSize: 26, color: "#8B93A3", marginTop: 6 }}>{handle}</div>
          {bio && (
            <div style={{ display: "flex", fontSize: 24, color: "#8B93A3", marginTop: 20, maxWidth: 780, textAlign: "center" }}>
              {bio.slice(0, 140)}
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
