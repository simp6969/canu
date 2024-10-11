import { SignUp } from "@clerk/nextjs";
import React from "react";

export default function Page() {
  return (
    <div className="w-[100vw] overflow-hidden h-[100vh] flex justify-center items-center">
      <SignUp path="/sign-up" />;
    </div>
  );
}
