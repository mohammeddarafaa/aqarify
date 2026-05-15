import type { ReactNode } from "react";
import {
  AlertTriangleIcon,
  BellIcon,
  CircleCheckIcon,
  CircleXIcon,
  InfoIcon,
  Loader2Icon,
} from "lucide-react";
import hotToast, { Toaster, type Renderable, type ToastOptions } from "react-hot-toast";
import {
  PushNotificationContent,
  PushNotificationIconFrame,
  type PushVariant,
} from "@/components/ui/push-notification";
import { cn } from "@/lib/utils";

/** Extra options on top of react-hot-toast. */
export type AppToastOptions = Omit<ToastOptions, "duration"> & {
  /** Secondary line under the title */
  description?: string;
  /** Use `false` to keep the toast until dismissed */
  duration?: number | false;
  /** Shown top-right (e.g. `now`, or a short relative time). */
  time?: string;
};

type ToastRest = Omit<AppToastOptions, "description" | "time">;

const shell: ToastOptions["style"] = {
  boxShadow:
    "0 10px 40px -10px color-mix(in oklch, var(--color-foreground) 12%, transparent), 0 4px 12px color-mix(in oklch, var(--color-foreground) 6%, transparent)",
};

/** Outer pill: icon + text columns (theme colors, frosted card). */
const pushBannerShellClass = cn(
  "!flex !items-start !gap-3",
  "!min-w-[min(100vw-2rem,22rem)] !max-w-[min(100vw-2rem,28rem)]",
  "!rounded-[28px] !border !border-[var(--color-border)] !px-3.5 !py-3",
  "!bg-[color-mix(in_oklch,var(--color-card)_88%,transparent)] !text-[var(--color-card-foreground)]",
  "!backdrop-blur-xl !backdrop-saturate-150",
  "dark:!bg-[color-mix(in_oklch,var(--color-card)_75%,transparent)]",
  "!font-sans !text-sm !leading-snug",
);

const baseToastClass = cn(
  pushBannerShellClass,
  "[&>div:last-child]:min-w-0 [&>div:last-child]:flex-1",
);

function renderBody(
  title: ReactNode,
  description?: string,
  timeLabel?: string,
): Renderable {
  if (title === undefined || title === "") return "";
  return (
    <PushNotificationContent
      title={title}
      description={description}
      time={timeLabel ?? "now"}
    />
  );
}

function hotOpts(
  _variant: PushVariant,
  baseDuration: number,
  rest?: ToastRest,
): ToastOptions {
  const { className, duration, style, ...toastRest } = rest ?? {};
  return {
    ...toastRest,
    duration: duration === false ? Infinity : (duration ?? baseDuration),
    className: cn(baseToastClass, className),
    style: { ...shell, ...style },
  };
}

function iconFrame(variant: PushVariant, node: ReactNode) {
  return <PushNotificationIconFrame variant={variant}>{node}</PushNotificationIconFrame>;
}

/**
 * App toasts (react-hot-toast) — push-style banner: squircle icon, title + body, timestamp.
 */
export const toast = {
  success: (message: string, extra?: AppToastOptions) => {
    const { description, time, ...rest } = extra ?? {};
    return hotToast.success(renderBody(message, description, time), {
      ...hotOpts("success", 4200, rest),
      icon: iconFrame(
        "success",
        <CircleCheckIcon className="size-5 shrink-0" aria-hidden />,
      ),
    });
  },

  error: (message: string, extra?: AppToastOptions) => {
    const { description, time, ...rest } = extra ?? {};
    return hotToast.error(renderBody(message, description, time), {
      ...hotOpts("error", 7200, rest),
      icon: iconFrame(
        "error",
        <CircleXIcon className="size-5 shrink-0" aria-hidden />,
      ),
    });
  },

  info: (message: string, extra?: AppToastOptions) => {
    const { description, time, ...rest } = extra ?? {};
    return hotToast(renderBody(message, description, time), {
      ...hotOpts("info", 5200, rest),
      icon: iconFrame("info", <InfoIcon className="size-5 shrink-0" aria-hidden />),
    });
  },

  warning: (message: string, extra?: AppToastOptions) => {
    const { description, time, ...rest } = extra ?? {};
    return hotToast(renderBody(message, description, time), {
      ...hotOpts("warning", 8200, rest),
      icon: iconFrame(
        "warning",
        <AlertTriangleIcon className="size-5 shrink-0" aria-hidden />,
      ),
    });
  },

  /** Indeterminate loading; dismiss or replace by resolving a promise with `promise()` */
  loading: (message: string, extra?: AppToastOptions) => {
    const { description, time, ...rest } = extra ?? {};
    return hotToast.loading(renderBody(message, description, time), {
      ...hotOpts("loading", Infinity, rest),
      icon: iconFrame(
        "loading",
        <Loader2Icon className="size-5 shrink-0 animate-spin" aria-hidden />,
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
    const { description, time, ...rest } = extra ?? {};
    return hotToast.promise(
      promise,
      {
        loading: renderBody(messages.loading, description, time),
        success: (data) =>
          renderBody(
            typeof messages.success === "function" ? messages.success(data) : messages.success,
            undefined,
            time,
          ) as Renderable,
        error: (err) =>
          renderBody(
            typeof messages.error === "function" ? messages.error(err) : messages.error,
            undefined,
            time,
          ) as Renderable,
      },
      {
        loading: {
          ...hotOpts("loading", Infinity, rest),
          icon: iconFrame(
            "loading",
            <Loader2Icon className="size-5 shrink-0 animate-spin" aria-hidden />,
          ),
        },
        success: {
          ...hotOpts("success", 4200, rest),
          icon: iconFrame(
            "success",
            <CircleCheckIcon className="size-5 shrink-0" aria-hidden />,
          ),
        },
        error: {
          ...hotOpts("error", 7200, rest),
          icon: iconFrame("error", <CircleXIcon className="size-5 shrink-0" aria-hidden />),
        },
      },
    );
  },

  /** Title + optional description without a status icon */
  message: (title: string, extra?: AppToastOptions) => {
    const { description, time, ...rest } = extra ?? {};
    return hotToast(renderBody(title, description, time), {
      ...hotOpts("neutral", 4500, rest),
      icon: iconFrame("neutral", <BellIcon className="size-5 shrink-0" aria-hidden />),
    });
  },

  /** Primary action button; stays until tap or duration */
  action: (
    title: string,
    act: { label: string; onClick: () => void },
    extra?: AppToastOptions,
  ) => {
    const { description, time, className, style, id, position, duration: dur } = extra ?? {};
    const duration = dur === false ? Infinity : (dur ?? 12_000);
    return hotToast.custom(
      (t) => (
        <div
          className={cn(pushBannerShellClass, "!items-center shadow-xl", className)}
          style={{ ...shell, ...style }}
        >
          <PushNotificationContent
            title={title}
            description={description}
            time={time ?? "now"}
            className="min-w-0 flex-1"
          />
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
        className: baseToastClass,
      }}
    />
  );
}
