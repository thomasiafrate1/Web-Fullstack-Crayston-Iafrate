import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    fullName: string | null;
    email: string;
    organizationName: string;
    plan: string;
  };
};

export const AppShell = ({ children, user }: AppShellProps) => {
  return (
    <div className="rf-app-layout rf-fade-up">
      <Sidebar orgName={user.organizationName} plan={user.plan} />
      <div className="min-h-screen">
        <Topbar fullName={user.fullName} email={user.email} />
        <div className="rf-content">
          <section className="space-y-6">{children}</section>
        </div>
      </div>
    </div>
  );
};
