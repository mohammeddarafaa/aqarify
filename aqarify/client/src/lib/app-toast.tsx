import type { ReactNode } from "react";
import {
  AlertTriangleIcon,
  CircleCheckIcon,
  CircleXIcon,
  InfoIcon,
  Loader2Icon,
} from "lucide-react";
import hotToast, { Toaster, type ToastOptions } from "react-hot-toast";
import { cn } from "@/lib/utils";

/** Extra options on top of react-hot-toast. */
export type AppToastOptions = Omit<ToastOptions, "duration"> & {
  /** Secondary line under the title */
  description?: string;
  /** Use `false` to keep the toast until dismissed */
  duration?: number | false;
};

const shell: ToastOptions["style"] = {
  boxShadow:
    "0 10px 40px -10px rgb(0 0 0 / 0.12), 0 4px 12px rgb(0 0 0 / 0.06)",
};

const baseToastClass = cn(
  "!min-w-[min(100vw-2rem,22rem)] !max-w-[min(100vw-2rem,26rem)]",
  "!rounded-2xl !px-4 !py-3.5",
  "!border !border-[var(--color-border)]",
  "!bg-[color-mix(in_oklch,var(--color-card)_88%,transparent)]",
  "!text-[var(--color-card-foreground)]",
  "!backdrop-blur-xl !backdrop-saturate-150",
  "dark:!bg-[color-mix(in_oklch,var(--color-card)_75%,transparent)]",
  "!font-sans !text-sm !leading-snug",
);

const variantClass = {
  success: "!border-l-[3px] !border-l-emerald-500 !pl-3.5",
  error: "!border-l-[3px] !border-l-red-500 !pl-3.5",
  info: "!border-l-[3px] !border-l-sky-500 !pl-3.5",
  warning: "!border-l-[3px] !border-l-amber-500 !pl-3.5",
  loading: "!border-l-[3px] !border-l-[var(--color-foreground)] !pl-3.5",
  neutral: "!border-l-[3px] !border-l-[var(--color-border)] !pl-3.5",
} as const;

function renderBody(title: ReactNode, description?: string): ReactNode {
  if (!description) return title;
  return (
    <div className="flex flex-col gap-1">
      <span className="font-semibold tracking-tight text-[var(--color-foreground)]">{title}</span>
      <span className="text-xs font-normal text-[var(--color-muted-foreground)]">{description}</span>
    </div>
  );
}

function hotOpts(
  variant: keyof typeof variantClass,
  baseDuration: number,
  rest?: Omit<AppToastOptions, "description">,
): ToastOptions {
  const { className, duration, style, ...toastRest } = rest ?? {};
  return {
    ...toastRest,
    duration: duration === false ? Infinity : (duration ?? baseDuration),
    className: cn(baseToastClass, variantClass[variant], className),
    style: { ...shell, ...style },
  };
}

/**
 * App toasts (react-hot-toast) — consistent styling, titles + descriptions,
 * loading, promises, and actions.
 */
export const toast = {
  success: (message: string, extra?: AppToastOptions) => {
    const { description, ...rest } = extra ?? {};
    return hotToast.success(renderBody(message, description), {
      ...hotOpts("success", 4200, rest),
      icon: (
        <CircleCheckIcon
          className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
      ),
    });
  },

  error: (message: string, extra?: AppToastOptions) => {
    const { description, ...rest } = extra ?? {};
    return hotToast.error(renderBody(message, description), {
      ...hotOpts("error", 7200, rest),
      icon: (
        <CircleXIcon className="size-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
      ),
    });
  },

  info: (message: string, extra?: AppToastOptions) => {
    const { description, ...rest } = extra ?? {};
    return hotToast(renderBody(message, description), {
      ...hotOpts("info", 5200, rest),
      icon: <InfoIcon className="size-5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />,
    });
  },

  warning: (message: string, extra?: AppToastOptions) => {
    const { description, ...rest } = extra ?? {};
    return hotToast(renderBody(message, description), {
      ...hotOpts("warning", 8200, rest),
      icon: (
        <AlertTriangleIcon className="size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      ),
    });
  },

  /** Indeterminate loading; dismiss or replace by resolving a promise with `promise()` */
  loading: (message: string, extra?: AppToastOptions) => {
    const { description, ...rest } = extra ?? {};
    return hotToast.loading(renderBody(message, description), {
      ...hotOpts("loading", Infinity, rest),
      icon: (
        <Loader2Icon
          className="size-5 shrink-0 animate-spin text-[var(--color-foreground)]"
          aria-hidden
        />
      ),
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    },
    extra?: AppToastOptions,
  ) => {
    const { description, ...rest } = extra ?? {};
    return hotToast.promise(
      promise,
      {
        loading: renderBody(messages.loading, description),
        success: (data) =>
          renderBody(
            typeof messages.success === "function" ? messages.success(data) : messages.success,
          ),
        error: (err) =>
          renderBody(typeof messages.error === "function" ? messages.error(err) : messages.error),
      },
      hotOpts("neutral", 4800, rest),
    );
  },

  /** Title + optional description without a status icon */
  message: (title: string, extra?: AppToastOptions) => {
    const { description, ...rest } = extra ?? {};
    return hotToast(renderBody(title, description), hotOpts("neutral", 4500, rest));
  },

  /** Primary action button; stays until tap or duration */
  action: (
    title: string,
    act: { label: string; onClick: () => void },
    extra?: AppToastOptions,
  ) => {
    const { description, className, style, id, position, duration: dur } = extra ?? {};
    const duration = dur === false ? Infinity : (dur ?? 12_000);
    return hotToast.custom(
      (t) => (
        <div
          className={cn(
            baseToastClass,
            variantClass.neutral,
            "flex items-start gap-3 shadow-xl",
            className,
          )}
          style={{ ...shell, ...style }}
        >
          <div className="min-w-0 flex-1">{renderBody(title, description)}</div>
          <button
            type="button"
            className="shrink-0 rounded-full bg-[var(--color-foreground)] px-3 py-1.5 text-xs font-semibold text-[var(--color-background)] transition-opacity hover:opacity-90"
            onClick={() => {
              act.onClick();
              hotToast.dismiss(t.id);
            }}
          >
            {act.label}
          </button>
        </div>
      ),
      { duration, id, position },
    );
  },

  custom: hotToast.custom,

  dismiss: (id?: string) => hotToast.dismiss(id),
};

export function AppToaster({ topOffset = 24 }: { topOffset?: number }) {
  return (
    <Toaster
      position="top-center"
      gutter={12}
      containerClassName="!fixed !left-1/2 !-translate-x-1/2 !flex !flex-col !items-center"
      containerStyle={{
        top: topOffset,
        zIndex: 100_003,
      }}
      toastOptions={{
        duration: 4500,
        style: shell,
        className: cn(baseToastClass, variantClass.neutral),
      }}
    />
  );
}
