import { motion } from "motion/react";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  icon: string;
  onClick?: () => void;
}

interface NotificationListProps {
  items: NotificationItem[];
}

export function NotificationList({ items }: NotificationListProps) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <motion.button
          key={item.id}
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.03 }}
          onClick={item.onClick}
          className="w-full text-start flex gap-3 rounded-xl border p-4 transition-colors"
          style={{
            background: item.is_read ? "var(--color-card)" : "color-mix(in oklab, var(--color-primary) 8%, white)",
            borderColor: item.is_read ? "var(--color-border)" : "color-mix(in oklab, var(--color-primary) 25%, var(--color-border))",
          }}
        >
          <span className="text-2xl shrink-0">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${item.is_read ? "font-medium" : "font-semibold"}`}>{item.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{item.body}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {new Date(item.created_at).toLocaleString("ar-EG")}
            </p>
          </div>
          {!item.is_read && <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1" />}
        </motion.button>
      ))}
    </div>
  );
}
