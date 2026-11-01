import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Logowanie" };
export default async function Page({ searchParams }: PageProps<"/login">) {
  const query = await searchParams;
  return <AuthForm accountDeleted={query.deleted === "1"} />;
}
