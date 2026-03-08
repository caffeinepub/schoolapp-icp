import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ClassInfo } from "./backend.d";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import ClassPage from "./pages/ClassPage";
import ClassesPage from "./pages/ClassesPage";
import LoginPage from "./pages/LoginPage";

type AppScreen = "login" | "loading" | "classes" | "class-detail";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const isLoggedIn = !!identity;

  const queryClient = useQueryClient();
  const [screen, setScreen] = useState<AppScreen>("login");
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);

  // Track whether we've already run auto-register for this session
  const autoRegistered = useRef(false);

  useEffect(() => {
    if (isInitializing) return;

    if (!isLoggedIn) {
      setScreen("login");
      autoRegistered.current = false;
      return;
    }

    // Actor not ready yet
    if (!actor || isFetching) {
      setScreen("loading");
      return;
    }

    // Already auto-registered this session — go to classes
    if (autoRegistered.current) {
      if (screen === "loading" || screen === "login") {
        setScreen("classes");
      }
      return;
    }

    // Run auto-register silently (first user becomes admin, others just get registered)
    setScreen("loading");
    autoRegistered.current = true;

    void (async () => {
      try {
        await actor.saveCallerUserProfile({ name: "leraar" });
      } catch {
        // Ignore — profile might already exist
      }
      try {
        await actor.requestApproval();
      } catch {
        // Ignore — might already be approved / is admin
      }
      // Refresh auth state
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["isApproved"] }),
        queryClient.invalidateQueries({ queryKey: ["isAdmin"] }),
        queryClient.invalidateQueries({ queryKey: ["callerProfile"] }),
      ]);
      setScreen("classes");
    })();
  }, [isInitializing, isLoggedIn, actor, isFetching, screen, queryClient]);

  if (isInitializing || screen === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground text-2xl font-display font-black">
              S
            </span>
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-lg">Laden…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast: "!text-base !font-body !rounded-xl !border-border",
            success: "!bg-success !text-success-foreground !border-success/30",
            error:
              "!bg-destructive !text-destructive-foreground !border-destructive/30",
          },
        }}
      />

      {screen === "login" && <LoginPage />}

      {screen === "classes" && (
        <ClassesPage
          onSelectClass={(cls) => {
            setSelectedClass(cls);
            setScreen("class-detail");
          }}
        />
      )}

      {screen === "class-detail" && selectedClass && (
        <ClassPage
          cls={selectedClass}
          onBack={() => {
            setSelectedClass(null);
            setScreen("classes");
          }}
        />
      )}
    </>
  );
}
