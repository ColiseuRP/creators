import { redirect } from "next/navigation";

import { getSessionContext } from "@/lib/session";

export default async function Home() {
  const actor = await getSessionContext();

  if (actor.user && actor.profile) {
    redirect("/dashboard");
  }

  redirect("/login");
}
