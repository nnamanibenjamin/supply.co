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
import { Textarea } from "@/components/ui/textarea.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { PlusIcon, EditIcon, TrashIcon, VideoIcon, Loader2Icon, ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";

export default function AdminVideosPage() {
  const currentUser = useQuery(api.registration.getCurrentUser);
  const videos = useQuery(
    api.videos.listAll,
    currentUser?.accountType === "admin" ? {} : "skip"
  );

  const createVideo = useMutation(api.videos.create);
  const updateVideo = useMutation(api.videos.update);
  const deleteVideo = useMutation(api.videos.remove);
  const generateUploadUrl = useMutation(api.videos.generateUploadUrl);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<"videos"> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<"file" | "url">("url");

  const [editingVideo, setEditingVideo] = useState<{
    _id: Id<"videos">;
    title: string;
    description?: string;
    placement: "hero" | "sidebar" | "content";
    displayOrder: number;
    isActive: boolean;
  } | null>(null);

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    videoStorageId: null as Id<"_storage"> | null,
    thumbnailStorageId: null as Id<"_storage"> | null,
    placement: "hero" as "hero" | "sidebar" | "content",
    displayOrder: 1,
  });

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    placement: "hero" as "hero" | "sidebar" | "content",
    displayOrder: 1,
    isActive: true,
  });

  // Access control
  if (currentUser === undefined || videos === undefined) {
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

  const handleFileUpload = async (file: File, type: "video" | "thumbnail") => {
    try {
      setIsUploading(true);
      
      // Validate file type
      if (type === "video" && !file.type.startsWith("video/")) {
        toast.error("Please upload a video file");
        return;
      }
      
      if (type === "thumbnail" && !file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      
      // Validate file size
      const maxSize = type === "video" ? 100 * 1024 * 1024 : 5 * 1024 * 1024; // 100MB for video, 5MB for thumbnail
      if (file.size > maxSize) {
        toast.error(`File must be less than ${type === "video" ? "100MB" : "5MB"}`);
        return;
      }

      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();
      
      if (type === "video") {
        setCreateForm({ ...createForm, videoStorageId: storageId });
        toast.success("Video uploaded successfully");
      } else {
        setCreateForm({ ...createForm, thumbnailStorageId: storageId });
        toast.success("Thumbnail uploaded successfully");
      }
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (uploadType === "file" && !createForm.videoStorageId) {
      toast.error("Please upload a video file");
      return;
    }

    if (uploadType === "url" && !createForm.videoUrl.trim()) {
      toast.error("Please enter a video URL");
      return;
    }

    try {
      await createVideo({
        title: createForm.title,
        description: createForm.description || undefined,
        videoStorageId: uploadType === "file" ? createForm.videoStorageId! : undefined,
        videoUrl: uploadType === "url" ? createForm.videoUrl : undefined,
        thumbnailStorageId: createForm.thumbnailStorageId || undefined,
        placement: createForm.placement,
        displayOrder: createForm.displayOrder,
      });
      toast.success("Video created successfully");
      setIsCreateOpen(false);
      setCreateForm({
        title: "",
        description: "",
        videoUrl: "",
        videoStorageId: null,
        thumbnailStorageId: null,
        placement: "hero",
        displayOrder: 1,
      });
      setUploadType("url");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create video");
      }
    }
  };

  const handleEdit = async () => {
    if (!editingVideo) return;
    try {
      await updateVideo({
        videoId: editingVideo._id,
        title: editForm.title,
        description: editForm.description || undefined,
        placement: editForm.placement,
        displayOrder: editForm.displayOrder,
        isActive: editForm.isActive,
      });
      toast.success("Video updated successfully");
      setIsEditOpen(false);
      setEditingVideo(null);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update video");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVideo({ videoId: deleteId });
      toast.success("Video deleted successfully");
      setDeleteId(null);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete video");
      }
    }
  };

  const openEdit = (video: typeof videos[0]) => {
    setEditingVideo({
      _id: video._id,
      title: video.title,
      description: video.description,
      placement: video.placement,
      displayOrder: video.displayOrder,
      isActive: video.isActive,
    });
    setEditForm({
      title: video.title,
      description: video.description || "",
      placement: video.placement,
      displayOrder: video.displayOrder,
      isActive: video.isActive,
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Video Management</h1>
          <p className="text-muted-foreground">
            Manage videos displayed on the website
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Video</DialogTitle>
              <DialogDescription>
                Upload a video or provide a URL (YouTube, Vimeo, etc.)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-title">Video Title *</Label>
                <Input
                  id="create-title"
                  placeholder="Product Demo"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  placeholder="Brief description of the video"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as "file" | "url")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">Video URL</TabsTrigger>
                  <TabsTrigger value="file">Upload File</TabsTrigger>
                </TabsList>
                
                <TabsContent value="url" className="space-y-2">
                  <Label htmlFor="create-url">Video URL *</Label>
                  <Input
                    id="create-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={createForm.videoUrl}
                    onChange={(e) => setCreateForm({ ...createForm, videoUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports YouTube, Vimeo, and direct video URLs
                  </p>
                </TabsContent>
                
                <TabsContent value="file" className="space-y-2">
                  <Label htmlFor="create-video">Upload Video *</Label>
                  <div className="flex gap-2">
                    <Input
                      ref={videoFileInputRef}
                      id="create-video"
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "video");
                      }}
                      disabled={isUploading}
                    />
                    {isUploading && <Loader2Icon className="h-5 w-5 animate-spin" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Maximum file size: 100MB</p>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="create-thumbnail">Thumbnail (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    ref={thumbnailFileInputRef}
                    id="create-thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "thumbnail");
                    }}
                    disabled={isUploading}
                  />
                  {isUploading && <Loader2Icon className="h-5 w-5 animate-spin" />}
                </div>
                <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
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
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                    <SelectItem value="content">Content Area</SelectItem>
                  </SelectContent>
                </Select>
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
              <Button onClick={handleCreate} disabled={!createForm.title.trim()}>
                Create Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Videos Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Videos</CardTitle>
          <CardDescription>View and manage all videos</CardDescription>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <VideoIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No videos yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first video to get started
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Video
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video._id}>
                    <TableCell>
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
                          <VideoIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{video.title}</p>
                        {video.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {video.videoStorageId ? "Uploaded" : "URL"}
                    </TableCell>
                    <TableCell className="capitalize">{video.placement}</TableCell>
                    <TableCell>{video.displayOrder}</TableCell>
                    <TableCell>
                      <Badge variant={video.isActive ? "default" : "secondary"}>
                        {video.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(video)}>
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(video._id)}
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
            <DialogTitle>Edit Video</DialogTitle>
            <DialogDescription>Update video details and settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Video Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
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
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="content">Content Area</SelectItem>
                </SelectContent>
              </Select>
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
                setEditingVideo(null);
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
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
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
