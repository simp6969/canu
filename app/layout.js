import { Poppins } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Canu — Collaborative Drawing Board",
  description:
    "Draw together in real-time. Create a room, share the code, and collaborate on a shared canvas.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${poppins.variable} font-sans antialiased`}>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
