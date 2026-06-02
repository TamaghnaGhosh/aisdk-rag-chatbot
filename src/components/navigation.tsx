"use client";

import {
  SignInButton,
  SignOutButton,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const Navigation = () => {
  const { isSignedIn } = useUser();

  return (
    <nav className="border-b border-(--foreground)/10">
      <div className="flex container h-16 items-center justify-between px-4  mx-auto">
        <div className="text-xl font-semibold">RAG Chatbot</div>

        <div className="flex gap-2">
          {isSignedIn ? (
            <SignOutButton>
              <Button className="cursor-pointer" variant="outline">Sign Out</Button>
            </SignOutButton>
          ) : (
            <>
              <SignInButton mode="modal">
                <Button variant="ghost" className="cursor-pointer">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="cursor-pointer">Sign Up</Button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
