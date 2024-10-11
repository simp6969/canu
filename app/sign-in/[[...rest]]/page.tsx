import React from "react";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="w-[100vw] overflow-hidden h-[100vh] flex justify-center items-center">
      <SignIn path="/sign-in" />
    </div>
  );
}
