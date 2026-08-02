import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";

import { queryClient } from "@/lib/queryClient";
import { router } from "./routes";
import { AuthProvider } from "./store/auth";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
