import { AgentMailClient } from "agentmail";
import { env } from "@/env";

export async function sendTestInvitationEmail(input: {
  to: string;
  ownerName: string;
  testTitle: string;
  invitationUrl: string;
}) {
  await getClient().inboxes.messages.send(env.AGENTMAIL_INBOX_ID, {
    to: input.to,
    subject: `${input.ownerName} shared a test: ${input.testTitle}`,
    text: [
      `${input.ownerName} invited you to take "${input.testTitle}".`,
      "",
      `Open your invitation: ${input.invitationUrl}`,
      "",
      "Sign in or create an account with this email address to open the test.",
    ].join("\n"),
    html: [
      `<p>${escapeHtml(input.ownerName)} invited you to take <strong>${escapeHtml(input.testTitle)}</strong>.</p>`,
      `<p><a href="${escapeAttribute(input.invitationUrl)}">Open your invitation</a></p>`,
      `<p>Sign in or create an account with <strong>${escapeHtml(input.to)}</strong> to open the test.</p>`,
    ].join(""),
  });
}

function getClient() {
  return new AgentMailClient({
    apiKey: env.AGENTMAIL_API_KEY,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}
