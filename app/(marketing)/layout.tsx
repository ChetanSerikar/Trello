export default function MarketingLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <div >
        {children}
      </div>
    );
  }