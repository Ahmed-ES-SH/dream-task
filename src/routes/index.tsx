import { createBrowserRouter, Navigate } from "react-router";

import DashboardLayout from "@/layouts/DashboardLayout";
import WebsiteLayout from "@/layouts/WebsiteLayout";
import LocaleGuard from "@/layouts/LocaleGuard";

import ProtectedRoute from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/en" replace />,
  },
  {
    element: <LocaleGuard />,
    children: [
      {
        path: ":locale",
        element: <WebsiteLayout />,
        children: [
          {
            index: true,
            lazy: async () => {
              const { default: Component } = await import("@/pages/Home");
              return { Component };
            },
          },
          {
            path: "login",
            lazy: async () => {
              const { default: Component } = await import("@/pages/Login");
              return { Component };
            },
          },
          {
            path: "register",
            lazy: async () => {
              const { default: Component } = await import("@/pages/Register");
              return { Component };
            },
          },
          {
            path: "dashboard",
            element: (
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            ),
            children: [
              {
                index: true,
                lazy: async () => {
                  const [{ default: Dashboard }, { default: MfaGuard }] =
                    await Promise.all([
                      import("@/pages/Dashboard"),
                      import("./MfaGuard"),
                    ]);

                  return {
                    Component: () => (
                      <MfaGuard>
                        <Dashboard />
                      </MfaGuard>
                    ),
                  };
                },
              },
              {
                path: "settings",
                lazy: async () => {
                  const { default: Component } = await import(
                    "@/pages/Settings"
                  );
                  return { Component };
                },
              },
            ],
          },
        ],
      },
    ],
  },
]);
