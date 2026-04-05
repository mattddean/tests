import { render, toPlainText } from "@react-email/render";
import { AgentMailClient } from "agentmail";
import { Effect, Layer } from "effect";
import { createElement } from "react";

import { serverConfig } from "@/server/config/server-config";

import { Mailer } from "./mailer";
import { TestInvitationEmail } from "./templates/test-invitation-email";

function getClient() {
  return new AgentMailClient({
    apiKey: serverConfig.AGENTMAIL_API_KEY,
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

        await getClient().inboxes.messages.send(serverConfig.AGENTMAIL_INBOX_ID, {
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
