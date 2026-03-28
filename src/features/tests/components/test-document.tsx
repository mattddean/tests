import { useEffect, useRef, useState } from "react";
import { AnimatePresence, Reorder, motion, useDragControls } from "motion/react";
import {
  Check,
  CirclePlus,
  GripVertical,
  Trash2,
  FileWarning,
  ArrowRight,
  Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EmptyState, StatusPill } from "@/components/ui";
import type { QuestionView, TestResponseView } from "../types";

type EditHandlers = {
  onTitleSave?: (value: string) => Promise<void> | void;
  onDescriptionSave?: (value: string) => Promise<void> | void;
  onQuestionPromptSave?: (questionId: string, value: string) => Promise<void> | void;
  onQuestionDescriptionSave?: (questionId: string, value: string) => Promise<void> | void;
  onQuestionRequiredToggle?: (questionId: string, value: boolean) => Promise<void> | void;
  onQuestionAdd?: (afterQuestionId?: string | null) => Promise<void> | void;
  onQuestionDelete?: (questionId: string) => Promise<void> | void;
  onQuestionReorder?: (questionIds: Array<string>) => Promise<void> | void;
  onChoiceSave?: (choiceId: string, value: string) => Promise<void> | void;
  onChoiceAdd?: (questionId: string, afterChoiceId?: string | null) => Promise<void> | void;
  onChoiceDelete?: (choiceId: string) => Promise<void> | void;
  onChoiceReorder?: (questionId: string, choiceIds: Array<string>) => Promise<void> | void;
};

type TakeHandlers = {
  onChoiceSelect?: (questionId: string, choiceId: string) => void;
  onSubmit?: () => void;
};

type SaveState = {
  label: string;
  tone: "neutral" | "accent" | "success" | "warning";
};

export function TestDocument({
  mode,
  title,
  description,
  status,
  questions,
  response,
  saveState,
  editable,
  handlers,
}: {
  mode: "edit" | "take" | "reviewResponse";
  title: string;
  description: string | null;
  status: string;
  questions: Array<QuestionView>;
  response?: TestResponseView;
  saveState?: SaveState;
  editable?: boolean;
  handlers?: EditHandlers & TakeHandlers;
}) {
  const selectedCount = Object.keys(response?.answers ?? {}).length;
  const unansweredCount = questions.filter((question) => !response?.answers?.[question.id]).length;
  const isSubmitted = response?.status === "submitted";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="border-b border-[color:var(--border)] px-6 py-5 md:px-8 md:py-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={status === "published" ? "success" : "neutral"}>{status}</StatusPill>
            {saveState ? <StatusPill tone={saveState.tone}>{saveState.label}</StatusPill> : null}
          </div>

          <div className="mt-4 space-y-3">
            <InlineEditableText
              value={title}
              placeholder="Untitled test"
              editable={mode === "edit" && Boolean(editable)}
              className="text-4xl font-semibold tracking-[-0.05em] md:text-5xl"
              onSave={handlers?.onTitleSave}
            />
            <InlineEditableText
              value={description ?? ""}
              placeholder="Add a short description for the test."
              editable={mode === "edit" && Boolean(editable)}
              multiline
              className="max-w-[75ch] text-base leading-7 text-[color:var(--muted)]"
              onSave={handlers?.onDescriptionSave}
            />
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No questions yet"
              description="Start with a multiple-choice prompt. The editor keeps the same reading view as the final test, so adding the first question is the moment the document comes alive."
              action={
                mode === "edit" && editable ? (
                  <Button onClick={() => handlers?.onQuestionAdd?.(null)}>
                    <CirclePlus className="mr-2 h-4 w-4" />
                    Add first question
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="px-3 py-3 md:px-4 md:py-4">
            <Reorder.Group
              axis="y"
              values={questions}
              onReorder={(items) => handlers?.onQuestionReorder?.(items.map((item) => item.id))}
              className="space-y-3"
            >
              {questions.map((question) => (
                <QuestionBlock
                  key={question.id}
                  mode={mode}
                  question={question}
                  selectedChoiceId={response?.answers?.[question.id] ?? null}
                  editable={Boolean(editable)}
                  onPromptSave={(value) => handlers?.onQuestionPromptSave?.(question.id, value)}
                  onDescriptionSave={(value) =>
                    handlers?.onQuestionDescriptionSave?.(question.id, value)
                  }
                  onRequiredToggle={(value) =>
                    handlers?.onQuestionRequiredToggle?.(question.id, value)
                  }
                  onQuestionDelete={() => handlers?.onQuestionDelete?.(question.id)}
                  onQuestionAdd={() => handlers?.onQuestionAdd?.(question.id)}
                  onChoiceSelect={(choiceId) => handlers?.onChoiceSelect?.(question.id, choiceId)}
                  onChoiceSave={(choiceId, value) => handlers?.onChoiceSave?.(choiceId, value)}
                  onChoiceAdd={(afterChoiceId) =>
                    handlers?.onChoiceAdd?.(question.id, afterChoiceId)
                  }
                  onChoiceDelete={(choiceId) => handlers?.onChoiceDelete?.(choiceId)}
                  onChoiceReorder={(choiceIds) =>
                    handlers?.onChoiceReorder?.(question.id, choiceIds)
                  }
                />
              ))}
            </Reorder.Group>

            {mode === "edit" && editable ? (
              <button
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[1.6rem] border border-dashed border-[color:var(--border-strong)] px-4 py-4 text-sm text-[color:var(--muted)] transition hover:border-[color:var(--accent-soft)] hover:bg-white"
                onClick={() => handlers?.onQuestionAdd?.(questions.at(-1)?.id ?? null)}
              >
                <CirclePlus className="h-4 w-4" />
                Add another question
              </button>
            ) : null}
          </div>
        )}
      </Card>

      {mode === "take" || mode === "reviewResponse" ? (
        <Card className="sticky bottom-5 px-5 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--muted)]">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-[color:var(--accent)]" />
                {selectedCount} selected
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {response?.lastAutosavedAt
                  ? `Last saved ${new Date(response.lastAutosavedAt).toLocaleTimeString()}`
                  : "No draft yet"}
              </span>
              {unansweredCount > 0 ? (
                <span className="inline-flex items-center gap-2 text-amber-700">
                  <FileWarning className="h-4 w-4" />
                  {unansweredCount} unanswered
                </span>
              ) : null}
            </div>
            {mode === "take" ? (
              <Button disabled={isSubmitted} onClick={handlers?.onSubmit} className="min-w-[12rem]">
                {isSubmitted ? "Submitted" : "Submit response"}
                {!isSubmitted ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function QuestionBlock({
  mode,
  question,
  selectedChoiceId,
  editable,
  onPromptSave,
  onDescriptionSave,
  onRequiredToggle,
  onQuestionDelete,
  onQuestionAdd,
  onChoiceSelect,
  onChoiceSave,
  onChoiceAdd,
  onChoiceDelete,
  onChoiceReorder,
}: {
  mode: "edit" | "take" | "reviewResponse";
  question: QuestionView;
  selectedChoiceId: string | null;
  editable: boolean;
  onPromptSave?: (value: string) => void | Promise<void>;
  onDescriptionSave?: (value: string) => void | Promise<void>;
  onRequiredToggle?: (value: boolean) => void | Promise<void>;
  onQuestionDelete?: () => void | Promise<void>;
  onQuestionAdd?: () => void | Promise<void>;
  onChoiceSelect?: (choiceId: string) => void;
  onChoiceSave?: (choiceId: string, value: string) => void | Promise<void>;
  onChoiceAdd?: (afterChoiceId?: string | null) => void | Promise<void>;
  onChoiceDelete?: (choiceId: string) => void | Promise<void>;
  onChoiceReorder?: (choiceIds: Array<string>) => void | Promise<void>;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={question}
      dragListener={false}
      dragControls={dragControls}
      className="group overflow-hidden rounded-[1.8rem] border border-transparent bg-transparent"
    >
      <motion.div
        layout
        className="rounded-[1.8rem] border border-[color:var(--border)] bg-white/70 px-5 py-5 shadow-[0_20px_35px_-30px_rgba(15,23,42,0.35)] transition hover:border-[color:var(--border-strong)] md:px-6 md:py-6"
      >
        <div className="flex items-start gap-4">
          {mode === "edit" && editable ? (
            <button
              className="mt-1 hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] p-2 text-[color:var(--muted)] opacity-0 transition group-hover:block group-hover:opacity-100"
              onPointerDown={(event) => dragControls.start(event)}
              aria-label="Reorder question"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : null}

          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-[11px] tracking-[0.24em] text-[color:var(--muted)] uppercase">
                  Question {question.position + 1}
                </p>
                <InlineEditableText
                  value={question.prompt}
                  placeholder="Untitled question"
                  editable={mode === "edit" && editable}
                  className="text-2xl font-semibold tracking-tight"
                  onSave={onPromptSave}
                />
                <InlineEditableText
                  value={question.description ?? ""}
                  placeholder="Optional helper copy for the question."
                  editable={mode === "edit" && editable}
                  multiline
                  className="text-sm leading-6 text-[color:var(--muted)]"
                  onSave={onDescriptionSave}
                />
              </div>

              {mode === "edit" && editable ? (
                <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    className={cn(
                      "rounded-full border px-3 py-2 text-xs tracking-[0.18em] uppercase transition",
                      question.required
                        ? "border-[color:var(--accent-soft)] bg-[color:var(--accent-faint)] text-[color:var(--accent-strong)]"
                        : "border-[color:var(--border)] text-[color:var(--muted)]",
                    )}
                    onClick={() => onRequiredToggle?.(!question.required)}
                  >
                    {question.required ? "Required" : "Optional"}
                  </button>
                  <button
                    className="rounded-xl border border-[color:var(--border)] p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--panel)]"
                    onClick={() => onQuestionAdd?.()}
                    aria-label="Add question below"
                  >
                    <CirclePlus className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-xl border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                    onClick={() => onQuestionDelete?.()}
                    aria-label="Delete question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>

            <ChoiceList
              questionId={question.id}
              mode={mode}
              editable={editable}
              choices={question.choices}
              selectedChoiceId={selectedChoiceId}
              onChoiceSelect={onChoiceSelect}
              onChoiceSave={onChoiceSave}
              onChoiceAdd={onChoiceAdd}
              onChoiceDelete={onChoiceDelete}
              onChoiceReorder={onChoiceReorder}
            />
          </div>
        </div>
      </motion.div>
    </Reorder.Item>
  );
}

function ChoiceList({
  questionId,
  mode,
  editable,
  choices,
  selectedChoiceId,
  onChoiceSelect,
  onChoiceSave,
  onChoiceAdd,
  onChoiceDelete,
  onChoiceReorder,
}: {
  questionId: string;
  mode: "edit" | "take" | "reviewResponse";
  editable: boolean;
  choices: Array<QuestionView["choices"][number]>;
  selectedChoiceId: string | null;
  onChoiceSelect?: (choiceId: string) => void;
  onChoiceSave?: (choiceId: string, value: string) => void | Promise<void>;
  onChoiceAdd?: (afterChoiceId?: string | null) => void | Promise<void>;
  onChoiceDelete?: (choiceId: string) => void | Promise<void>;
  onChoiceReorder?: (choiceIds: Array<string>) => void | Promise<void>;
}) {
  return (
    <Reorder.Group
      axis="y"
      values={choices}
      onReorder={(items) => onChoiceReorder?.(items.map((item) => item.id))}
      className="space-y-2"
    >
      {choices.map((choice) => (
        <ChoiceRow
          key={choice.id}
          questionId={questionId}
          mode={mode}
          editable={editable}
          choice={choice}
          selected={selectedChoiceId === choice.id}
          onSelect={() => onChoiceSelect?.(choice.id)}
          onSave={(value) => onChoiceSave?.(choice.id, value)}
          onAdd={() => onChoiceAdd?.(choice.id)}
          onDelete={() => onChoiceDelete?.(choice.id)}
        />
      ))}
      {mode === "edit" && editable ? (
        <button
          className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-3 text-sm text-[color:var(--muted)] transition hover:border-[color:var(--accent-soft)] hover:bg-[color:var(--panel)]"
          onClick={() => onChoiceAdd?.(choices.at(-1)?.id ?? null)}
        >
          <CirclePlus className="h-4 w-4" />
          Add choice
        </button>
      ) : null}
    </Reorder.Group>
  );
}

function ChoiceRow({
  mode,
  editable,
  choice,
  selected,
  onSelect,
  onSave,
  onAdd,
  onDelete,
}: {
  questionId: string;
  mode: "edit" | "take" | "reviewResponse";
  editable: boolean;
  choice: QuestionView["choices"][number];
  selected: boolean;
  onSelect: () => void;
  onSave?: (value: string) => void | Promise<void>;
  onAdd?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item value={choice} dragListener={false} dragControls={dragControls}>
      <motion.div
        layout
        className={cn(
          "group flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
          selected
            ? "border-[color:var(--accent-soft)] bg-[color:var(--accent-faint)]"
            : "border-[color:var(--border)] bg-white/70 hover:border-[color:var(--border-strong)]",
        )}
      >
        {mode === "edit" && editable ? (
          <button
            className="hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] p-2 text-[color:var(--muted)] opacity-0 transition group-hover:block group-hover:opacity-100"
            onPointerDown={(event) => dragControls.start(event)}
            aria-label="Reorder choice"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : (
          <button
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
              selected
                ? "border-[color:var(--accent-strong)] bg-[color:var(--accent-strong)] text-white"
                : "border-[color:var(--border-strong)] bg-white",
            )}
            onClick={mode === "take" ? onSelect : undefined}
            disabled={mode !== "take"}
          >
            {selected ? <Check className="h-4 w-4" /> : null}
          </button>
        )}

        <div className="min-w-0 flex-1">
          <InlineEditableText
            value={choice.label}
            placeholder="Choice label"
            editable={mode === "edit" && editable}
            className={cn("text-sm leading-6", selected && "text-[color:var(--foreground)]")}
            onSave={onSave}
          />
        </div>

        {mode === "edit" && editable ? (
          <div className="hidden items-center gap-1 opacity-0 transition group-hover:flex group-hover:opacity-100">
            <button
              className="rounded-xl border border-[color:var(--border)] p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--panel)]"
              onClick={() => onAdd?.()}
            >
              <CirclePlus className="h-4 w-4" />
            </button>
            <button
              className="rounded-xl border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
              onClick={() => onDelete?.()}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </motion.div>
    </Reorder.Item>
  );
}

function InlineEditableText({
  value,
  placeholder,
  editable,
  multiline = false,
  className,
  onSave,
}: {
  value: string;
  placeholder: string;
  editable: boolean;
  multiline?: boolean;
  className?: string;
  onSave?: (value: string) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const trimmedValue = value.trim();

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      if ("select" in (ref.current ?? {})) {
        ref.current?.select?.();
      }
    }
  }, [editing]);

  const displayValue = trimmedValue || placeholder;

  const save = async () => {
    setEditing(false);
    const nextValue = draft.trim() || placeholder;
    if (nextValue !== value && onSave) {
      await onSave(nextValue === placeholder ? "" : nextValue);
    }
  };

  if (!editable) {
    return (
      <div className={cn(className, !trimmedValue && "text-[color:var(--muted)] italic")}>
        {displayValue}
      </div>
    );
  }

  if (!editing) {
    return (
      <button
        className={cn(
          "w-full rounded-2xl border border-transparent px-2 py-1 text-left transition hover:border-[color:var(--accent-soft)] hover:bg-[color:var(--accent-faint)]",
          className,
          !trimmedValue && "text-[color:var(--muted)] italic",
        )}
        onClick={() => setEditing(true)}
      >
        {displayValue}
      </button>
    );
  }

  return (
    <AnimatePresence initial={false}>
      <motion.div
        initial={{ opacity: 0.7, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0.8, y: -2 }}
      >
        {multiline ? (
          <textarea
            ref={(node) => {
              ref.current = node;
            }}
            value={draft}
            rows={3}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => void save()}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                void save();
              }
            }}
            className={cn(
              "w-full rounded-2xl border border-[color:var(--accent-soft)] bg-white px-3 py-2 text-sm leading-6 shadow-[0_0_0_4px_var(--accent-faint)] outline-none",
              className,
            )}
          />
        ) : (
          <input
            ref={(node) => {
              ref.current = node;
            }}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => void save()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void save();
              }
              if (event.key === "Escape") {
                setDraft(value);
                setEditing(false);
              }
            }}
            className={cn(
              "w-full rounded-2xl border border-[color:var(--accent-soft)] bg-white px-3 py-2 shadow-[0_0_0_4px_var(--accent-faint)] outline-none",
              className,
            )}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
