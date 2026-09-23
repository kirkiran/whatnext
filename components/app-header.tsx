export function AppHeader() {
  return (
    <header className="flex flex-col gap-ds-3 border-b border-line pb-ds-5 sm:flex-row sm:items-baseline sm:gap-ds-5">
      <h1 className="shrink-0 text-page-title tracking-tight text-content-primary">
        WhatNext
      </h1>
      <p className="max-w-3xl text-body-small text-content-secondary sm:border-l sm:border-line-brand sm:pl-ds-5">
        Decide what to do next when your day gets messy
      </p>
    </header>
  );
}
