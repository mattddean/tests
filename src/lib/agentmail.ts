import { AgentMailClient } from "agentmail";
import { render, toPlainText } from "@react-email/render";
import { createElement } from "react";
import { env } from "@/env";
import { TestInvitationEmail } from "@/features/tests/emails/test-invitation-email";

export async function sendTestInvitationEmail(input: {
  to: string;
  ownerName: string;
  testTitle: string;
  invitationUrl: string;
}) {
  const html = await render(
    createElement(TestInvitationEmail, {
      ownerName: input.ownerName,
      recipientEmail: input.to,
      testTitle: input.testTitle,
      invitationUrl: input.invitationUrl,
    }),
  );

  await getClient().inboxes.messages.send(env.AGENTMAIL_INBOX_ID, {
    to: input.to,
    subject: `${input.ownerName} shared a test: ${input.testTitle}`,
    text: toPlainText(html),
    html,
  });
}

function getClient() {
  return new AgentMailClient({
    apiKey: env.AGENTMAIL_API_KEY,
  });
}
