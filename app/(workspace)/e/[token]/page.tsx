import { EventScreen } from "@/components/event-screen";
export const metadata = { title: "Twoje spotkanie", referrer: "no-referrer" };
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <EventScreen token={token} />;
}
