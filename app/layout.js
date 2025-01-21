import "./globals.css";

export const metadata = {
  title: "canu?",
  description: "whiteboard for teamwork",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`hutao`}>{children}</body>
    </html>
  );
}
