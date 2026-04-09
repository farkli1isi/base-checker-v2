export const metadata = {
  title: "Base Checker",
  description: "Check your Base wallet score & airdrop eligibility",
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: "https://placehold.co/1200x630/070B14/1652F0?text=Base+Checker",
      button: {
        title: "Check Wallet",
        action: {
          type: "launch_miniapp",
          name: "Base Checker",
          url: "https://base-checker-v2.vercel.app",
          splashBackgroundColor: "#070B14",
        },
      },
    }),
    "fc:frame": JSON.stringify({
      version: "1",
      imageUrl: "https://placehold.co/1200x630/070B14/1652F0?text=Base+Checker",
      button: {
        title: "Check Wallet",
        action: {
          type: "launch_frame",
          name: "Base Checker",
          url: "https://base-checker-v2.vercel.app",
          splashBackgroundColor: "#070B14",
        },
      },
    }),
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#070B14", color: "#F1F5F9", fontFamily: "sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
