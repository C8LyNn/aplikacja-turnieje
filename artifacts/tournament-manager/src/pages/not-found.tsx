import { Link } from "wouter";
import { Trophy, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">404 - Not Found</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-md">
          The tournament or page you are looking for doesn't exist or has been moved.
        </p>
        <Button asChild size="lg">
          <Link href="/">Back to Dashboard</Link>
        </Button>
      </div>
    </Layout>
  );
}
