import { LandingContent } from "@/components/marketing/landing-content";
import { getSessionContext } from "@/lib/auth/session";

export default async function LandingPage() {
  // On lit la session pour adapter le CTA selon que l'utilisateur est connecte ou non.
  const { user } = await getSessionContext();
  const ctaHref = user ? "/dashboard" : "/register";
  const ctaText = user ? "Aller au dashboard" : "Commencer";

  // On rend la landing animee avec les props de navigation du CTA principal.
  return <LandingContent ctaHref={ctaHref} ctaText={ctaText} />;
}
