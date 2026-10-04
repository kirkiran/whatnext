import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-ds-4 py-ds-8">
      <SignIn />
    </main>
  );
}
