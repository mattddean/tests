import { Data } from "effect";

export class TestNotFound extends Data.TaggedError("TestNotFound")<{
  readonly message: string;
}> {}

export class QuestionNotFound extends Data.TaggedError("QuestionNotFound")<{
  readonly message: string;
}> {}

export class ChoiceNotFound extends Data.TaggedError("ChoiceNotFound")<{
  readonly message: string;
}> {}

export class ResponseNotFound extends Data.TaggedError("ResponseNotFound")<{
  readonly message: string;
}> {}

export class UserNotFound extends Data.TaggedError("UserNotFound")<{
  readonly message: string;
}> {}

export class ForbiddenTestAccess extends Data.TaggedError("ForbiddenTestAccess")<{
  readonly message: string;
}> {}

export class OnlyOwnerCanPublish extends Data.TaggedError("OnlyOwnerCanPublish")<{
  readonly message: string;
}> {}

export class OnlyOwnerCanShareWithTakers extends Data.TaggedError("OnlyOwnerCanShareWithTakers")<{
  readonly message: string;
}> {}

export class OnlyOwnerCanManageEditors extends Data.TaggedError("OnlyOwnerCanManageEditors")<{
  readonly message: string;
}> {}

export class CannotPublishEmptyTest extends Data.TaggedError("CannotPublishEmptyTest")<{
  readonly message: string;
}> {}

export class AtLeastTwoChoicesRequired extends Data.TaggedError("AtLeastTwoChoicesRequired")<{
  readonly message: string;
}> {}

export class ResponseAlreadySubmitted extends Data.TaggedError("ResponseAlreadySubmitted")<{
  readonly message: string;
}> {}

export class InviteEmailMismatch extends Data.TaggedError("InviteEmailMismatch")<{
  readonly message: string;
}> {}

export class TestMustBePublished extends Data.TaggedError("TestMustBePublished")<{
  readonly message: string;
}> {}

export class RequiredQuestionsIncomplete extends Data.TaggedError("RequiredQuestionsIncomplete")<{
  readonly message: string;
}> {}

export class OwnerAlreadyHasAccess extends Data.TaggedError("OwnerAlreadyHasAccess")<{
  readonly message: string;
}> {}

export type TestsError =
  | AtLeastTwoChoicesRequired
  | CannotPublishEmptyTest
  | ChoiceNotFound
  | ForbiddenTestAccess
  | InviteEmailMismatch
  | OnlyOwnerCanManageEditors
  | OnlyOwnerCanPublish
  | OnlyOwnerCanShareWithTakers
  | OwnerAlreadyHasAccess
  | QuestionNotFound
  | RequiredQuestionsIncomplete
  | ResponseAlreadySubmitted
  | ResponseNotFound
  | TestMustBePublished
  | TestNotFound
  | UserNotFound;
