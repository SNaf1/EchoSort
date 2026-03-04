import { notFound } from "next/navigation";

import { TicketDetailsClient } from "@/components/tickets/ticket-details-client";
import { getTicketDetails } from "@/lib/tickets/ticket-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TicketPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;
  const details = await getTicketDetails(id);
  if (!details) notFound();

  return <TicketDetailsClient initialData={details} />;
}
