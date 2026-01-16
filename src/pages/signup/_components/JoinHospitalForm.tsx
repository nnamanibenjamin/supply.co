import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2Icon } from "lucide-react";

const formSchema = z.object({
  hospitalCode: z.string().min(6, "Valid hospital code is required"),
  name: z.string().min(2, "Your name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function JoinHospitalForm() {
  const navigate = useNavigate();
  const currentUser = useQuery(api.registration.getCurrentUser);
  const registerHospitalStaff = useMutation(api.registration.registerHospitalStaff);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hospitalCode: "",
      name: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerHospitalStaff({
        hospitalCode: data.hospitalCode,
        name: data.name,
        phone: data.phone,
        email: data.email,
      });

      toast.success(
        "Registration successful! Your account is pending verification by the admin team."
      );
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    }
  };

  // Check if user is already registered
  if (currentUser === undefined) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If user already has an account, redirect to dashboard
  if (currentUser !== null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Already Registered</CardTitle>
          <CardDescription>
            You have already completed registration with this account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your account type: <span className="font-semibold capitalize">{currentUser.accountType}</span>
          </p>
          {currentUser.verificationStatus === "pending" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Your account is pending admin verification. You'll be notified once approved.
              </p>
            </div>
          )}
          {currentUser.verificationStatus === "approved" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Your account is verified and active!
              </p>
            </div>
          )}
          {currentUser.verificationStatus === "rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Your account verification was rejected. Please contact support.
              </p>
            </div>
          )}
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Your Hospital</CardTitle>
        <CardDescription>
          Enter your hospital code to join an existing hospital account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="hospitalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hospital Code</FormLabel>
                  <FormControl>
                    <Input placeholder="H123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+254 712 345 678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@hospital.co.ke" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> The hospital must be verified before you can join. 
                Contact your hospital administrator for the hospital code.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Hospital"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
