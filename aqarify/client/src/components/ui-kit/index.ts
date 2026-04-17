// =============================================================
// Aqarify UI Kit — single import surface for the whole app
//
// Every consumer imports from "@/components/ui-kit" rather than
// reaching directly into shadcn, Radix, HeroUI, or Aceternity.
// This gives us ONE place to swap implementations later (e.g. if
// we pull in HeroUI's Table or a different DatePicker).
//
// Layer conventions:
//   - shadcn primitives (stable, heavily customised) → re-exported as-is
//   - Aceternity motion components → re-exported under their original names
//   - motion helpers (FadeInView, PageTransition, ShimmeringText) → re-exported
// =============================================================

// ── shadcn primitives ───────────────────────────────────────────
export { Button, buttonVariants } from "@/components/ui/button"
export { Input } from "@/components/ui/input"
export { Label } from "@/components/ui/label"
export { Textarea } from "@/components/ui/textarea"
export { Badge } from "@/components/ui/badge"
export { Separator } from "@/components/ui/separator"
export { Skeleton } from "@/components/ui/skeleton"
export { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
export { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
export { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// New shadcn primitives added in Phase A
export { Checkbox } from "@/components/ui/checkbox"
export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
export { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
export { Progress } from "@/components/ui/progress"
export { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
export { Switch } from "@/components/ui/switch"
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// ── Aceternity motion showcase components ──────────────────────
export {
  Spotlight,
  BentoGrid,
  BentoGridItem,
  FocusCards,
  type FocusCard,
  InfiniteMovingCards,
  type InfiniteMovingCard,
  AuroraBackground,
  Meteors,
  AppleCardsCarousel,
  type AppleCard,
} from "@/components/aceternity"

// ── motion helpers ─────────────────────────────────────────────
export { FadeInView } from "@/components/motion/fade-in-view"
export { PageTransition } from "@/components/motion/page-transition"
export { ShimmeringText } from "@/components/motion/shimmering-text"
export { NotificationList } from "@/components/motion/notification-list"

// ── toast (react-hot-toast) ───────────────────────────────────
export { AppToaster as Toaster, toast } from "@/lib/app-toast"

// ── util ───────────────────────────────────────────────────────
export { cn } from "@/lib/utils"
