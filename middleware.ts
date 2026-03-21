import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/login(.*)", "/api/brain/(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const ADMIN_EMAIL = "cmouscio@gmail.com";

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect();
  }

  if (isAdminRoute(req)) {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses?.[0]?.emailAddress;

    if (email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
