import { useState } from "react";
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
import { Loader2Icon, UploadIcon } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

const formSchema = z.object({
  hospitalName: z.string().min(3, "Hospital name must be at least 3 characters"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  medicalLicense: z.instanceof(File).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function HospitalSignupForm() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [medicalLicenseId, setMedicalLicenseId] = useState<Id<"_storage"> | null>(null);
  
  const currentUser = useQuery(api.auth.getCurrentUser);
  const generateUploadUrl = useMutation(api.auth.generateUploadUrl);
  const registerHospital = useMutation(api.auth.registerHospital);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hospitalName: "",
      contactPerson: "",
      phone: "",
      email: "",
    },
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      setMedicalLicenseId(storageId);
      toast.success("Medical license uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload medical license");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const result = await registerHospital({
        hospitalName: data.hospitalName,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        medicalLicenseStorageId: medicalLicenseId || undefined,
      });

      toast.success(
        `Registration successful! Your hospital code is: ${result.hospitalCode}. Please save it for your records.`
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
        <CardTitle>Hospital Registration</CardTitle>
        <CardDescription>
          Register your medical facility to start creating RFQs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="hospitalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hospital Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Nairobi General Hospital" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
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
                    <Input type="email" placeholder="contact@hospital.co.ke" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medicalLicense"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Medical License (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                            handleFileUpload(file);
                          }
                        }}
                        disabled={uploading}
                        {...field}
                      />
                      {uploading && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                          Uploading...
                        </p>
                      )}
                      {medicalLicenseId && !uploading && (
                        <p className="text-sm text-green-600">✓ Uploaded successfully</p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Your account will be pending verification by our admin team. 
                You'll receive a unique hospital code upon registration.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || uploading}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
