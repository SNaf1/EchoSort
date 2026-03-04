export function formatTicketCode(id: string) {
  return id.slice(-8).toUpperCase().padStart(8, "0");
}

export function ticketSearchText(id: string) {
  const code = formatTicketCode(id);
  return `${id} ${code} #${code} TICKET-${code}`;
}
