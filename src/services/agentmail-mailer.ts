import { render, toPlainText } from "@react-email/render";
import { AgentMailClient } from "agentmail";
import { Effect, Layer } from "effect";
import { createElement } from "react";

import { TestInvitationEmail } from "@/lib/emails/test-invitation-email";
import { env } from "@/lib/env";
import { Mailer } from "@/services/mailer";

function getClient() {
  return new AgentMailClient({
    apiKey: env.AGENTMAIL_API_KEY,
  });
}

export const MailerLive = Layer.succeed(Mailer, {
  sendTestInvitation: (input) =>
    Effect.tryPromise({
      try: async () => {
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
      },
      catch: (cause) =>
        cause instanceof Error ? cause : new Error("Failed to send test invitation email"),
    }),
});
