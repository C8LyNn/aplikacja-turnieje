import { AlertTriangle } from "lucide-react";
import { Layout } from "@/components/layout";
import { RoleHomeLink } from "@/components/app-navigation";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">404 — Nie znaleziono</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-md">
          Szukana strona lub turniej nie istnieje.
        </p>
        <RoleHomeLink className="bg-primary px-5 py-3 text-primary-foreground hover:text-primary-foreground hover:bg-primary/90" />
      </div>
    </Layout>
  );
}
