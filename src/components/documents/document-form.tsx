"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { DocumentIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { Field, inputClass } from "@/src/components/ui/field";
import { type DocumentType, documentTypes, type NewDocument } from "@/src/lib/mock-documents";

type Errors = Partial<Record<"title" | "content", string>>;

const input = `${inputClass} aria-invalid:border-red-500`;
const textarea =
  "min-h-[160px] w-full resize-y rounded-lg border border-line-strong bg-surface-soft px-3.5 py-2.5 text-sm text-fg transition placeholder:text-muted hover:border-brand/40 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20 aria-invalid:border-red-500";

const ErrorText = ({ id, children }: { id: string; children?: ReactNode }) =>
  children ? (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-500">
      {children}
    </p>
  ) : null;

/** onSave resolves to an error message to show in the form, or null when the document was saved */
type DocumentFormProps = { onSave: (document: NewDocument) => Promise<string | null>; onCancel: () => void };

export function DocumentForm({ onSave, onCancel }: DocumentFormProps) {
  const [values, setValues] = useState<NewDocument>({ title: "", type: "NDA", content: "", requireSignature: true });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function change<K extends keyof NewDocument>(key: K, value: NewDocument[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    // clear a message as soon as the person starts fixing it
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key as keyof Errors];
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors = {};
    if (!values.title.trim()) found.title = "Enter a document title";
    if (!values.content.trim()) found.content = "Enter the text visitors will read";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFormError("");
    const problem = await onSave({ ...values, title: values.title.trim(), content: values.content.trim() });
    // on success the page closes this form; on failure keep what was typed and say why
    if (problem) {
      setFormError(problem);
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5 [box-shadow:var(--shadow)] sm:p-6" aria-label="Create document">
      <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold">
        <DocumentIcon size={16} className="text-brand" />
        Create Document
      </h2>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Title" htmlFor="doc-title" required>
            <input
              id="doc-title"
              autoFocus
              value={values.title}
              onChange={(event) => change("title", event.target.value)}
              placeholder="e.g. Standard Visitor NDA"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "doc-title-error" : undefined}
              className={input}
            />
            <ErrorText id="doc-title-error">{errors.title}</ErrorText>
          </Field>

          <Field label="Type" htmlFor="doc-type">
            <select id="doc-type" value={values.type} onChange={(event) => change("type", event.target.value as DocumentType)} className={`${inputClass} px-3`}>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Content" htmlFor="doc-content" required>
          <textarea
            id="doc-content"
            value={values.content}
            onChange={(event) => change("content", event.target.value)}
            placeholder="The text visitors will read before signing..."
            aria-invalid={Boolean(errors.content)}
            aria-describedby={errors.content ? "doc-content-error" : undefined}
            className={textarea}
          />
          <ErrorText id="doc-content-error">{errors.content}</ErrorText>
        </Field>

        <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-soft">
          <input
            type="checkbox"
            checked={values.requireSignature}
            onChange={(event) => change("requireSignature", event.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-green-600"
          />
          Require visitors to sign this during check-in
        </label>

        {formError && (
          <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-300">
            {formError}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save Document"}
          </Button>
        </div>
      </form>
    </section>
  );
}
