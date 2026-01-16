import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { PlusIcon, EditIcon, TrashIcon, ImageIcon, Loader2Icon } from "lucide-react";

export default function AdminBannersPage() {
  const currentUser = useQuery(api.registration.getCurrentUser);
  const banners = useQuery(
    api.banners.listAll,
    currentUser?.accountType === "admin" ? {} : "skip"
  );

  const createBanner = useMutation(api.banners.create);
  const updateBanner = useMutation(api.banners.update);
  const deleteBanner = useMutation(api.banners.remove);
  const generateUploadUrl = useMutation(api.banners.generateUploadUrl);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<"banners"> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [editingBanner, setEditingBanner] = useState<{
    _id: Id<"banners">;
    title: string;
    link?: string;
    placement: "header" | "sidebar" | "footer" | "hero";
    width?: number;
    height?: number;
    displayOrder: number;
    isActive: boolean;
  } | null>(null);

  const [createForm, setCreateForm] = useState({
    title: "",
    link: "",
    placement: "hero" as "header" | "sidebar" | "footer" | "hero",
    width: 0,
    height: 0,
    displayOrder: 1,
    imageStorageId: null as Id<"_storage"> | null,
  });

  const [editForm, setEditForm] = useState({
    title: "",
    link: "",
    placement: "hero" as "header" | "sidebar" | "footer" | "hero",
    width: 0,
    height: 0,
    displayOrder: 1,
    isActive: true,
  });

  // Access control
  if (currentUser === undefined || banners === undefined) {
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

  const handleFileUpload = async (file: File, isEdit: boolean = false) => {
    try {
      setIsUploading(true);
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      
      // Validate file size (5MB max)
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
      
      if (isEdit) {
        // For edit, we'll handle the storage ID separately
        toast.success("Image uploaded! Save to update the banner.");
      } else {
        setCreateForm({ ...createForm, imageStorageId: storageId });
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.imageStorageId) {
      toast.error("Please upload an image");
      return;
    }

    try {
      await createBanner({
        title: createForm.title,
        imageStorageId: createForm.imageStorageId,
        link: createForm.link || undefined,
        placement: createForm.placement,
        width: createForm.width > 0 ? createForm.width : undefined,
        height: createForm.height > 0 ? createForm.height : undefined,
        displayOrder: createForm.displayOrder,
      });
      toast.success("Banner created successfully");
      setIsCreateOpen(false);
      setCreateForm({
        title: "",
        link: "",
        placement: "hero",
        width: 0,
        height: 0,
        displayOrder: 1,
        imageStorageId: null,
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create banner");
      }
    }
  };

  const handleEdit = async () => {
    if (!editingBanner) return;
    try {
      await updateBanner({
        bannerId: editingBanner._id,
        title: editForm.title,
        link: editForm.link || undefined,
        placement: editForm.placement,
        width: editForm.width > 0 ? editForm.width : undefined,
        height: editForm.height > 0 ? editForm.height : undefined,
        displayOrder: editForm.displayOrder,
        isActive: editForm.isActive,
      });
      toast.success("Banner updated successfully");
      setIsEditOpen(false);
      setEditingBanner(null);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update banner");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBanner({ bannerId: deleteId });
      toast.success("Banner deleted successfully");
      setDeleteId(null);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete banner");
      }
    }
  };

  const openEdit = (banner: typeof banners[0]) => {
    setEditingBanner({
      _id: banner._id,
      title: banner.title,
      link: banner.link,
      placement: banner.placement,
      width: banner.width,
      height: banner.height,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
    });
    setEditForm({
      title: banner.title,
      link: banner.link || "",
      placement: banner.placement,
      width: banner.width || 0,
      height: banner.height || 0,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banner Management</h1>
          <p className="text-muted-foreground">
            Manage promotional banners displayed on the website
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Banner</DialogTitle>
              <DialogDescription>
                Upload a banner image and configure its placement
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-title">Banner Title *</Label>
                <Input
                  id="create-title"
                  placeholder="Summer Promotion"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-image">Upload Image *</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    id="create-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={isUploading}
                  />
                  {isUploading && <Loader2Icon className="h-5 w-5 animate-spin" />}
                </div>
                <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-link">Link URL (Optional)</Label>
                <Input
                  id="create-link"
                  placeholder="https://example.com"
                  value={createForm.link}
                  onChange={(e) => setCreateForm({ ...createForm, link: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-placement">Placement *</Label>
                <Select
                  value={createForm.placement}
                  onValueChange={(value) =>
                    setCreateForm({ ...createForm, placement: value as typeof createForm.placement })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero Section</SelectItem>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-width">Width (px, optional)</Label>
                  <Input
                    id="create-width"
                    type="number"
                    placeholder="Auto"
                    value={createForm.width || ""}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, width: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-height">Height (px, optional)</Label>
                  <Input
                    id="create-height"
                    type="number"
                    placeholder="Auto"
                    value={createForm.height || ""}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, height: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-order">Display Order *</Label>
                <Input
                  id="create-order"
                  type="number"
                  value={createForm.displayOrder}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, displayOrder: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!createForm.title.trim() || !createForm.imageStorageId}>
                Create Banner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banners Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Banners</CardTitle>
          <CardDescription>View and manage all promotional banners</CardDescription>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No banners yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first banner to get started
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Banner
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner._id}>
                    <TableCell>
                      {banner.imageUrl ? (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{banner.title}</TableCell>
                    <TableCell className="capitalize">{banner.placement}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {banner.width && banner.height
                        ? `${banner.width}x${banner.height}px`
                        : "Auto"}
                    </TableCell>
                    <TableCell>{banner.displayOrder}</TableCell>
                    <TableCell>
                      <Badge variant={banner.isActive ? "default" : "secondary"}>
                        {banner.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(banner)}>
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(banner._id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
            <DialogDescription>Update banner details and settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Banner Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-link">Link URL (Optional)</Label>
              <Input
                id="edit-link"
                value={editForm.link}
                onChange={(e) => setEditForm({ ...editForm, link: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-placement">Placement *</Label>
              <Select
                value={editForm.placement}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, placement: value as typeof editForm.placement })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero Section</SelectItem>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-width">Width (px, optional)</Label>
                <Input
                  id="edit-width"
                  type="number"
                  value={editForm.width || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, width: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-height">Height (px, optional)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  value={editForm.height || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, height: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-order">Display Order *</Label>
              <Input
                id="edit-order"
                type="number"
                value={editForm.displayOrder}
                onChange={(e) =>
                  setEditForm({ ...editForm, displayOrder: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Active Status</Label>
              <Switch
                id="edit-active"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditOpen(false);
                setEditingBanner(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!editForm.title.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this banner? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
