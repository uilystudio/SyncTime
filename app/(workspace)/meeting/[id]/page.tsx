import { MemberEventScreen } from "@/components/member-event-screen";
export const metadata = { title: "Twoje spotkanie", referrer: "no-referrer" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; joined?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <MemberEventScreen
      id={id}
      welcome={
        query.created === "1"
          ? "created"
          : query.joined === "1"
            ? "joined"
            : undefined
      }
    />
  );
}
