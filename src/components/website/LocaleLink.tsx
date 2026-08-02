import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { useLocale } from "../../hooks/useLocale";

type LocaleLinkProps = Omit<LinkProps, "to"> & {
  children?: ReactNode;
  to: LinkProps["to"];
};

export default function LocaleLink({
  to,
  children,
  ...props
}: LocaleLinkProps) {
  const locale = useLocale() ?? "en";
  const localizedTo = typeof to === "string" ? `/${locale}${to}` : to;

  return (
    <Link to={localizedTo} {...props}>
      {children}
    </Link>
  );
}
