import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-content-center bg-background gap-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" />;
  return <AppShell />;
}