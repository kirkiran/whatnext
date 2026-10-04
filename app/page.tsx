"use client";

import { useAuth } from "@clerk/nextjs";
import { useRef } from "react";
import { AppHeader } from "@/components/app-header";
import { TaskWorkspace } from "@/components/task-workspace";

export default function HomePage() {
  const { isLoaded, userId } = useAuth();
  const currentUserRef = useRef(userId);
  currentUserRef.current = isLoaded ? userId : null;
  return (
    <main className="min-h-screen bg-canvas px-ds-4 py-ds-6 text-content-primary sm:px-ds-6 sm:py-ds-8 lg:px-ds-8 lg:py-ds-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-ds-8">
        <AppHeader />
        {!isLoaded ? (
          <p role="status">Loading your workspace…</p>
        ) : userId ? (
          <TaskWorkspace key={userId} isCurrentUser={() => currentUserRef.current === userId} />
        ) : (
          <p role="status">Sign in to continue.</p>
        )}
      </div>
    </main>
  );
}
