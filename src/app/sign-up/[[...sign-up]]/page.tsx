import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Private research engine / Sign up"
      title={
        <>
          Decisions,
          <br />
          with receipts.
        </>
      }
    >
      <SignUp />
    </AuthShell>
  );
}
