import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPrivatePage = createRouteMatcher(["/"]);

// API handlers perform their own checks and return JSON rather than redirects.
export default clerkMiddleware(async (auth, request) => {
  if (isPrivatePage(request)) {
    await auth.protect({ unauthenticatedUrl: new URL("/sign-in", request.url).toString() });
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
