import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#0d1020]">
      <SignIn path="/sign-in" />
    </div>
  );
}
