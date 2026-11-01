import { GroupInvitation } from "@/components/groups";
export const metadata = {
  title: "Zaproszenie do grupy",
  referrer: "no-referrer",
};
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <GroupInvitation token={token} />;
}
