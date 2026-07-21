import { Navbar } from "@/modules/home/ui/components/navbar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <main className="flex flex-col min-h-screen text-[#e3e2e2] relative">
      <Navbar />
      <div className="flex-1 flex flex-col pt-24">{children}</div>
    </main>
  );
};

export default Layout;
