import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Loader2Icon, ImageIcon, SaveIcon } from "lucide-react";

export default function SiteContentPage() {
  const currentUser = useQuery(api.registration.getCurrentUser);
  const siteContent = useQuery(
    api.siteContent.getForAdmin,
    currentUser?.accountType === "admin" ? {} : "skip"
  );

  const updateContent = useMutation(api.siteContent.update);
  const generateUploadUrl = useMutation(api.siteContent.generateUploadUrl);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [form, setForm] = useState({
    siteName: "supply.co.ke",
    heroTitle: "Connect Hospitals with Medical Suppliers",
    heroSubtitle: "Kenya's premier B2B marketplace for medical equipment and supplies. Submit RFQs, receive competitive quotes, and connect with verified suppliers.",
    searchPlaceholder: "Search for medical supplies...",
    stat1Value: "500+",
    stat1Label: "Verified Suppliers",
    stat2Value: "1,000+",
    stat2Label: "Products Listed",
    stat3Value: "100%",
    stat3Label: "Free for Hospitals",
    logoStorageId: null as Id<"_storage"> | null,
    logoUrl: null as string | null,
    logoWidth: 32,
    logoHeight: 32,
  });

  // Load existing content into form
  useEffect(() => {
    if (siteContent && !isInitialized) {
      setForm({
        siteName: siteContent.siteName,
        heroTitle: siteContent.heroTitle,
        heroSubtitle: siteContent.heroSubtitle,
        searchPlaceholder: siteContent.searchPlaceholder,
        stat1Value: siteContent.stat1Value,
        stat1Label: siteContent.stat1Label,
        stat2Value: siteContent.stat2Value,
        stat2Label: siteContent.stat2Label,
        stat3Value: siteContent.stat3Value,
        stat3Label: siteContent.stat3Label,
        logoStorageId: siteContent.logoStorageId || null,
        logoUrl: siteContent.logoUrl || null,
        logoWidth: siteContent.logoWidth || 32,
        logoHeight: siteContent.logoHeight || 32,
      });
      setIsInitialized(true);
    }
  }, [siteContent, isInitialized]);

  // Access control
  if (currentUser === undefined || siteContent === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!currentUser || currentUser.accountType !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You need admin privileges to view this page</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();
      setForm({ ...form, logoStorageId: storageId });
      toast.success("Logo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload logo");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      await updateContent({
        siteName: form.siteName,
        heroTitle: form.heroTitle,
        heroSubtitle: form.heroSubtitle,
        searchPlaceholder: form.searchPlaceholder,
        stat1Value: form.stat1Value,
        stat1Label: form.stat1Label,
        stat2Value: form.stat2Value,
        stat2Label: form.stat2Label,
        stat3Value: form.stat3Value,
        stat3Label: form.stat3Label,
        logoStorageId: form.logoStorageId || undefined,
        logoWidth: form.logoWidth || undefined,
        logoHeight: form.logoHeight || undefined,
      });
      
      toast.success("Site content updated successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update site content");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Content Management</h1>
          <p className="text-muted-foreground">
            Customize your homepage logo, text, and branding
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SaveIcon className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle>Logo & Branding</CardTitle>
          <CardDescription>Upload and configure your site logo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo">Logo Image</Label>
            {form.logoUrl && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground mb-2">Current Logo:</p>
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  style={{
                    width: form.logoWidth ? `${form.logoWidth}px` : 'auto',
                    height: form.logoHeight ? `${form.logoHeight}px` : 'auto',
                  }}
                  className="rounded"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
                disabled={isUploading}
              />
              {isUploading && <Loader2Icon className="h-5 w-5 animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logoWidth">Logo Width (px)</Label>
              <Input
                id="logoWidth"
                type="number"
                placeholder="32"
                value={form.logoWidth || ""}
                onChange={(e) => setForm({ ...form, logoWidth: parseInt(e.target.value) || 32 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoHeight">Logo Height (px)</Label>
              <Input
                id="logoHeight"
                type="number"
                placeholder="32"
                value={form.logoHeight || ""}
                onChange={(e) => setForm({ ...form, logoHeight: parseInt(e.target.value) || 32 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              placeholder="supply.co.ke"
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Displays next to the logo</p>
          </div>
        </CardContent>
      </Card>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>Main headline and description on the homepage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heroTitle">Hero Title</Label>
            <Input
              id="heroTitle"
              placeholder="Connect Hospitals with Medical Suppliers"
              value={form.heroTitle}
              onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
            <Textarea
              id="heroSubtitle"
              placeholder="Kenya's premier B2B marketplace..."
              value={form.heroSubtitle}
              onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="searchPlaceholder">Search Box Placeholder</Label>
            <Input
              id="searchPlaceholder"
              placeholder="Search for medical supplies..."
              value={form.searchPlaceholder}
              onChange={(e) => setForm({ ...form, searchPlaceholder: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Section */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>Three key stats displayed below the search box</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stat1Value">Stat 1 Value</Label>
              <Input
                id="stat1Value"
                placeholder="500+"
                value={form.stat1Value}
                onChange={(e) => setForm({ ...form, stat1Value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stat1Label">Stat 1 Label</Label>
              <Input
                id="stat1Label"
                placeholder="Verified Suppliers"
                value={form.stat1Label}
                onChange={(e) => setForm({ ...form, stat1Label: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stat2Value">Stat 2 Value</Label>
              <Input
                id="stat2Value"
                placeholder="1,000+"
                value={form.stat2Value}
                onChange={(e) => setForm({ ...form, stat2Value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stat2Label">Stat 2 Label</Label>
              <Input
                id="stat2Label"
                placeholder="Products Listed"
                value={form.stat2Label}
                onChange={(e) => setForm({ ...form, stat2Label: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stat3Value">Stat 3 Value</Label>
              <Input
                id="stat3Value"
                placeholder="100%"
                value={form.stat3Value}
                onChange={(e) => setForm({ ...form, stat3Value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stat3Label">Stat 3 Label</Label>
              <Input
                id="stat3Label"
                placeholder="Free for Hospitals"
                value={form.stat3Label}
                onChange={(e) => setForm({ ...form, stat3Label: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SaveIcon className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
