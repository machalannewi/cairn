import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Everything is private except the marketing page, auth screens and share links.
const isPublic = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/share/(.*)"]);
// API handlers check the session themselves (apiWorkspace) so callers get a JSON 401, not a redirect.
const isApi = createRouteMatcher(["/api/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req) && !isApi(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
