import { CreateEventForm } from "@/components/create-event-form";
export const metadata = { title: "Nowe spotkanie" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;
  return (
    <CreateEventForm
      initialGroupId={
        group && /^[a-f0-9-]{36}$/i.test(group) ? group : undefined
      }
    />
  );
}
