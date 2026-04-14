import { signOutAction } from "@/actions/auth";

type TopbarProps = {
  fullName: string | null;
  email: string;
};

const initialsFromName = (name: string | null, email: string) => {
  const source = (name || email).trim();
  if (!source) {
    return "JD";
  }
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
};

export const Topbar = ({ fullName, email }: TopbarProps) => {
  const initials = initialsFromName(fullName, email);

  return (
    <header className="rf-topbar">
      <div className="rf-topbar-right ml-auto">
        <div className="flex items-center gap-3">
          <span className="rf-avatar">{initials}</span>
          <p className="max-w-[190px] truncate text-sm text-[var(--rf-text-muted)]">
            {fullName || email}
          </p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="rf-btn rf-btn-outline">
            Se deconnecter
          </button>
        </form>
      </div>
    </header>
  );
};
