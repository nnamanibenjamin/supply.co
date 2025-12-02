import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";

export function HospitalStaffSignup() {
  const navigate = useNavigate();
  const { signinRedirect } = useAuth();
  const createHospitalStaff = useMutation(api.auth.createHospitalStaff);
  
  const [formData, setFormData] = useState({
    hospitalCode: "",
    name: "",
    phone: "",
    email: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createHospitalStaff({
        hospitalCode: formData.hospitalCode.trim().toUpperCase(),
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
      });

      setIsSuccess(true);
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle2Icon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Registration Successful!</CardTitle>
          <CardDescription>
            Your account has been created and is pending verification by our admin team.
            You will receive an email once your account is approved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">What happens next?</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Our admin team will verify your hospital affiliation</li>
              <li>Verification typically takes 24-48 hours</li>
              <li>Once approved, you can sign in with full access to your hospital's account</li>
            </ul>
          </div>
          <Button className="w-full" onClick={() => signinRedirect()}>
            Sign In
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
            Return to Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Your Hospital</CardTitle>
        <CardDescription>Join your hospital's existing account using your hospital code</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hospitalCode">Hospital Code *</Label>
            <Input
              id="hospitalCode"
              placeholder="HOSP-12345"
              value={formData.hospitalCode}
              onChange={(e) => setFormData({ ...formData, hospitalCode: e.target.value })}
              required
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Contact your hospital administrator for the hospital code
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+254 712 345 678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@hospital.co.ke"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <strong>Note:</strong> All new staff accounts require admin verification to ensure security.
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Join Hospital"}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => signinRedirect()}
              className="text-primary hover:underline font-medium"
            >
              Sign In
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
