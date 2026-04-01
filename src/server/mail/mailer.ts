import { Context } from "effect";
import type { Effect } from "effect";

export type SendTestInvitationInput = {
  readonly to: string;
  readonly ownerName: string;
  readonly testTitle: string;
  readonly invitationUrl: string;
};

export type MailerShape = {
  readonly sendTestInvitation: (
    input: SendTestInvitationInput,
  ) => Effect.Effect<void, Error>;
};

export class Mailer extends Context.Tag("Mailer")<Mailer, MailerShape>() {}
