export type TestId = string;
export type QuestionId = string;
export type ChoiceId = string;
export type ResponseId = string;
export type UserId = string;

export type TestStatus = "draft" | "published" | "archived";
export type QuestionType = "multiple_choice";
export type ResponseStatus = "draft" | "submitted";
export type TestPermission = "owner" | "editor" | "taker";
