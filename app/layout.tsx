import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yusuf Ansari | The Silliest 5-Year-Old Ever! 🤪",
  description: "Hi! I'm Yusuf Ansari, a 5-year-old from Bhadohi living in Noida. I love playing, white chocolate, and being super silly! 🍫🎮",
  keywords: ["Yusuf Ansari", "Shiv Nadar School", "Noida", "Bhadohi"],
  authors: [{ name: "Yusuf Ansari" }],
  openGraph: {
    title: "Yusuf Ansari | The Silliest 5-Year-Old Ever! 🤪",
    description: "Hi! I'm Yusuf Ansari, a 5-year-old from Bhadohi living in Noida. I love playing, white chocolate, and being super silly!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
