import type { InfoItemProps } from "@/types/profile";

export function ProfileInfoItem({ label, value, icon: Icon }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}
