import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  useTranslations,
  type Messages,
  type NestedKeys,
  type PathValue,
} from "@/hooks/useTranslations";
import type { User } from "@/types/user";

export type Translator = ReturnType<typeof useTranslations>;

export type StringKey = {
  [K in NestedKeys<Messages>]: PathValue<Messages, K> extends string ? K : never;
}[NestedKeys<Messages>];

export type StatusBadgeProps = {
  user: User;
};

export type InfoItemProps = {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
};
