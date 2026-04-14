import { LandingContent } from "@/components/marketing/landing-content";
import { getSessionContext } from "@/lib/auth/session";

export default async function LandingPage() {
  const { user } = await getSessionContext();
  const ctaHref = user ? "/dashboard" : "/register";
  const ctaText = user ? "Aller au dashboard" : "Commencer";

  return <LandingContent ctaHref={ctaHref} ctaText={ctaText} />;
}
