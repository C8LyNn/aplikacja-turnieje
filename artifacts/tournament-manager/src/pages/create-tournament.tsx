import { Layout } from "@/components/layout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTournament } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Tournament name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  format: z.enum(["single_elimination", "double_elimination", "round_robin"]),
  maxPlayers: z.coerce.number().min(2, "Must have at least 2 players").optional().or(z.literal('')),
});

export default function CreateTournament() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createTournament = useCreateTournament();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      format: "single_elimination",
      maxPlayers: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createTournament.mutate(
      {
        data: {
          name: values.name,
          description: values.description,
          format: values.format,
          maxPlayers: values.maxPlayers === "" ? undefined : Number(values.maxPlayers),
        },
      },
      {
        onSuccess: (data) => {
          toast({
            title: "Tournament created",
            description: "You can now start adding players.",
          });
          setLocation(`/tournaments/${data.id}`);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create tournament. Please try again.",
          });
        },
      }
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Trophy className="w-8 h-8" />
            New Tournament
          </h1>
          <p className="text-muted-foreground mt-2">
            Set up the rules and format for your new competition.
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Tournament Details</CardTitle>
            <CardDescription>Enter the basic information about the tournament.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tournament Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Summer Championship 2024" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the event..."
                          className="resize-none bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tournament Format</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select a format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single_elimination">Single Elimination</SelectItem>
                            <SelectItem value="double_elimination">Double Elimination</SelectItem>
                            <SelectItem value="round_robin">Round Robin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The structure of the competition.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxPlayers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Players (Optional)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Leave empty for unlimited" {...field} className="bg-background" />
                        </FormControl>
                        <FormDescription>
                          Maximum number of participants allowed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createTournament.isPending} className="w-full sm:w-auto">
                    {createTournament.isPending ? "Creating..." : "Create Tournament"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}