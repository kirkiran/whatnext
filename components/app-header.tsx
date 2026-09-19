export function AppHeader() {
  return (
    <header className="flex flex-col gap-ds-6 border-b border-line-subtle pb-ds-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-ds-2">
        <h1 className="text-page-title text-content-primary">WhatNext</h1>
        <p className="max-w-3xl text-body text-content-secondary">
          Decide what to do next when your day gets messy
        </p>
      </div>
    </header>
  );
}
