import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
  onSuccess?: () => void;
}

export function SignInDialog({ open, onOpenChange, redirectTo = "/rate-coach", onSuccess }: SignInDialogProps) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      const user = await login(data.email, data.password);
      
      if (!user.isAthlete) {
        toast({
          title: "Access Denied",
          description: "Only athletes can write reviews.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Signed in successfully",
        description: "You can now submit your review.",
      });
      onOpenChange(false);
      form.reset();
      onSuccess?.();
      setLocation(redirectTo);
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) form.reset();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#202020]">Sign In Required</DialogTitle>
          <DialogDescription className="text-[#666666]">
            Please sign in to write a review. Only registered athletes can submit reviews.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                      data-testid="input-signin-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      data-testid="input-signin-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-[#F5C518] text-[#111111] font-bold"
              disabled={form.formState.isSubmitting}
              data-testid="button-signin-submit"
            >
              {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-sm text-[#666666]">
              Don't have an account?{" "}
              <Button
                type="button"
                variant="ghost"
                className="p-0 h-auto text-[#F5C518] font-semibold"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                  setLocation("/register");
                }}
                data-testid="link-register"
              >
                Register here
              </Button>
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
