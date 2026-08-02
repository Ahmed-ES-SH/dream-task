import type { ReactNode } from "react";
import { Navigate, useParams } from "react-router";

import { useAuth } from "@/store/auth";

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated } = useAuth();
  const { locale } = useParams<{ locale?: string }>();

  if (!isAuthenticated) {
    return <Navigate to={`/${locale ?? "en"}/login`} replace />;
  }

  return children;
}
