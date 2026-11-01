import { notFound } from "next/navigation";
import { isMeetingView } from "@/lib/meetings";
import { MyMeetings } from "@/components/my-meetings";
export const metadata = { title: "Twoje spotkania" };
export default async function Page({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!isMeetingView(view)) notFound();
  return <MyMeetings key={view} view={view} />;
}
