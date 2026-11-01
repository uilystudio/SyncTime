import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function ActionButton({
  className = "",
  primary,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${primary ? "border-transparent bg-[#b19cfc] text-[#1c1435] hover:bg-[#c3b0ff]" : "border-[#303646] bg-[#181e2b] text-[#d2d7e4] hover:bg-[#242b3b]"} ${className}`}
      {...props}
    />
  );
}
const fieldClass =
  "min-h-11 w-full rounded-lg border border-[#323b4d] bg-[#0e141f] px-3 py-2 text-base leading-relaxed text-[#e5e9f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50";
export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />
  );
}
export function SelectField(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${fieldClass} ${props.className ?? ""}`} />
  );
}
export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`${fieldClass} ${props.className ?? ""}`} />
  );
}
export function ActionError({ children }: { children: React.ReactNode }) {
  return children ? (
    <p
      role="alert"
      className="my-3 rounded-lg border border-[#b96b6b55] bg-[#b96b6b12] p-3 text-sm leading-relaxed text-[#f0b2b2]"
    >
      {children}
    </p>
  ) : null;
}
export function SectionCard({
  children,
  title,
  description,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section
      className="my-6 rounded-xl border border-[#293140] bg-[#131a26] p-5 sm:p-6"
      aria-label={title}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
