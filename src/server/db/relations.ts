import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
    accounts: r.many.account({
      from: r.user.id,
      to: r.account.userId,
    }),
    memberships: r.many.testUser({
      from: r.user.id,
      to: r.testUser.userId,
    }),
    grantedMemberships: r.many.testUser({
      from: r.user.id,
      to: r.testUser.grantedByUserId,
      alias: "grantedByMembership",
    }),
    grantedEmailAccesses: r.many.testEmailAccess({
      from: r.user.id,
      to: r.testEmailAccess.grantedByUserId,
      alias: "grantedByEmailAccess",
    }),
    responses: r.many.testResponse({
      from: r.user.id,
      to: r.testResponse.userId,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  test: {
    members: r.many.testUser({
      from: r.test.id,
      to: r.testUser.testId,
    }),
    emailAccesses: r.many.testEmailAccess({
      from: r.test.id,
      to: r.testEmailAccess.testId,
    }),
    questions: r.many.testQuestion({
      from: r.test.id,
      to: r.testQuestion.testId,
    }),
    responses: r.many.testResponse({
      from: r.test.id,
      to: r.testResponse.testId,
    }),
  },
  testUser: {
    test: r.one.test({
      from: r.testUser.testId,
      to: r.test.id,
      optional: false,
    }),
    user: r.one.user({
      from: r.testUser.userId,
      to: r.user.id,
      optional: false,
    }),
    grantedBy: r.one.user({
      from: r.testUser.grantedByUserId,
      to: r.user.id,
      alias: "grantedByMembership",
    }),
  },
  testEmailAccess: {
    test: r.one.test({
      from: r.testEmailAccess.testId,
      to: r.test.id,
      optional: false,
    }),
    grantedBy: r.one.user({
      from: r.testEmailAccess.grantedByUserId,
      to: r.user.id,
      alias: "grantedByEmailAccess",
      optional: false,
    }),
  },
  testQuestion: {
    test: r.one.test({
      from: r.testQuestion.testId,
      to: r.test.id,
      optional: false,
    }),
    choices: r.many.questionChoice({
      from: r.testQuestion.id,
      to: r.questionChoice.questionId,
    }),
    answers: r.many.responseAnswer({
      from: r.testQuestion.id,
      to: r.responseAnswer.questionId,
    }),
  },
  questionChoice: {
    question: r.one.testQuestion({
      from: r.questionChoice.questionId,
      to: r.testQuestion.id,
      optional: false,
    }),
    answers: r.many.responseAnswer({
      from: r.questionChoice.id,
      to: r.responseAnswer.choiceId,
    }),
  },
  testResponse: {
    test: r.one.test({
      from: r.testResponse.testId,
      to: r.test.id,
      optional: false,
    }),
    user: r.one.user({
      from: r.testResponse.userId,
      to: r.user.id,
      optional: false,
    }),
    answers: r.many.responseAnswer({
      from: r.testResponse.id,
      to: r.responseAnswer.responseId,
    }),
  },
  responseAnswer: {
    response: r.one.testResponse({
      from: r.responseAnswer.responseId,
      to: r.testResponse.id,
      optional: false,
    }),
    question: r.one.testQuestion({
      from: r.responseAnswer.questionId,
      to: r.testQuestion.id,
      optional: false,
    }),
    choice: r.one.questionChoice({
      from: r.responseAnswer.choiceId,
      to: r.questionChoice.id,
      optional: false,
    }),
  },
}));
