import { redirect } from "next/navigation";

type ConnexionPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function ConnexionPage({ searchParams }: ConnexionPageProps) {
  const params = await searchParams;

  if (params.next) {
    redirect(`/login?next=${encodeURIComponent(params.next)}`);
  }

  redirect("/login");
}
