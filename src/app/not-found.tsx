import { LinkButton, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-grid px-6">
      <div className="text-center">
        <div className="flex justify-center"><Logo /></div>
        <div className="label mt-10 !text-lime">Error / 404</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Nothing marks this trail.</h1>
        <p className="mt-3 text-muted">The page or shared report doesn&apos;t exist, or its link was revoked.</p>
        <LinkButton href="/app" className="mt-8">Back to workspace</LinkButton>
      </div>
    </div>
  );
}
