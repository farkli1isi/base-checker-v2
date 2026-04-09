import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = "https://base-checker-v2.vercel.app";
  
  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjEzNTkxNDQsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhFNzUyNjNFMjVDREMzQThFRkZDODcwRkRlQTUzMzczYjNkYTIyOWEwIn0",
      payload: "eyJkb21haW4iOiJiYXNlY2hlY2tlci10d28udmVyY2VsLmFwcCJ9",
      signature: "f1dHCciweXDDmqOyvn+lEtD7QNK7WTnsQH07J0kwIDJrWLsR/O2iuCfb4Rnzsa7kWBghaCO1DRjeh/l5jZrRSxw=",
    },
    frame: {
      version: "1",
      name: "Base Checker",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: "https://placehold.co/1200x630/070B14/1652F0?text=Base+Checker",
      buttonTitle: "Check Wallet",
      splashBackgroundColor: "#070B14",
    },
  };

  return NextResponse.json(config);
}
