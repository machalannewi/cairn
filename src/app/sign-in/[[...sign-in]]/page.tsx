import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome back / Sign in"
      title={
        <>
          Pick up the
          <br />
          trail.
        </>
      }
    >
      <SignIn />
    </AuthShell>
  );
}
