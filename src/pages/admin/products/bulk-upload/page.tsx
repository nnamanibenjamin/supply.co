import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Loader2Icon, ArrowLeftIcon, UploadIcon, DownloadIcon, FileTextIcon, ImageIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

interface ProductRow {
  name: string;
  description: string;
  categoryName: string;
  imageUrl?: string;
}

export default function BulkUploadPage() {
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState("");
  const [parsedProducts, setParsedProducts] = useState<ProductRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentUser = useQuery(api.registration.getCurrentUser);
  const categories = useQuery(api.categories.listAll);
  const bulkCreate = useMutation(api.adminProducts.bulkCreate);
  const uploadImageFromUrl = useAction(api.adminProductsActions.uploadImageFromUrl);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvData(text);
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (text: string) => {
    try {
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        toast.error("CSV file must have at least a header row and one data row");
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const nameIndex = headers.indexOf("name");
      const descriptionIndex = headers.indexOf("description");
      const categoryIndex = headers.indexOf("category");
      const imageIndex = headers.indexOf("imageurl");

      if (nameIndex === -1 || descriptionIndex === -1 || categoryIndex === -1) {
        toast.error("CSV must have 'name', 'description', and 'category' columns");
        return;
      }

      const products: ProductRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        if (values[nameIndex] && values[descriptionIndex] && values[categoryIndex]) {
          products.push({
            name: values[nameIndex],
            description: values[descriptionIndex],
            categoryName: values[categoryIndex],
            imageUrl: imageIndex !== -1 && values[imageIndex] ? values[imageIndex] : undefined,
          });
        }
      }

      setParsedProducts(products);
      toast.success(`Parsed ${products.length} products from CSV`);
    } catch (error) {
      toast.error("Failed to parse CSV file");
      console.error(error);
    }
  };

  const handleBulkUpload = async () => {
    if (!categories || parsedProducts.length === 0) return;

    setIsProcessing(true);
    try {
      // Process products one by one to handle image uploads
      const productsWithIds = [];
      let uploadedImages = 0;
      let failedImages = 0;

      for (const product of parsedProducts) {
        const category = categories.find(
          c => c.name.toLowerCase() === product.categoryName.toLowerCase()
        );
        
        if (!category) {
          throw new Error(`Category "${product.categoryName}" not found`);
        }

        let imageStorageId: Id<"_storage"> | undefined = undefined;

        // Download and upload image if URL is provided
        if (product.imageUrl) {
          try {
            imageStorageId = await uploadImageFromUrl({ imageUrl: product.imageUrl });
            uploadedImages++;
          } catch (error) {
            console.error(`Failed to upload image for ${product.name}:`, error);
            failedImages++;
            // Continue without image
          }
        }

        productsWithIds.push({
          name: product.name,
          description: product.description,
          categoryId: category._id as Id<"categories">,
          imageStorageId,
        });
      }

      const result = await bulkCreate({ products: productsWithIds });

      toast.success(
        `Successfully created ${result.created} product(s)${
          result.skipped > 0 ? `, skipped ${result.skipped} duplicate(s)` : ""
        }${uploadedImages > 0 ? `, uploaded ${uploadedImages} image(s)` : ""}${
          failedImages > 0 ? `, failed to upload ${failedImages} image(s)` : ""
        }`
      );
      navigate("/admin/products");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create products");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = "name,description,category,imageUrl\nSurgical Gloves,Latex-free surgical gloves for medical procedures,Surgical Equipment,https://example.com/gloves.jpg\nIV Stand,Adjustable height IV pole with wheels,Medical Equipment,https://example.com/iv-stand.jpg";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (currentUser === undefined || categories === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!currentUser || currentUser.accountType !== "admin") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Only administrators can bulk upload products</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/admin">
            <Button>Return to Admin Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/products">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Bulk Upload Products</h1>
        <p className="text-muted-foreground">
          Upload multiple products at once using a CSV file
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Upload a CSV file with columns: name, description, category, imageUrl (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button variant="outline" onClick={downloadTemplate}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <label>
              <Button variant="outline" asChild>
                <span>
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Upload CSV
                </span>
              </Button>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {csvData && (
            <div className="space-y-2">
              <label className="text-sm font-medium">CSV Preview</label>
              <Textarea
                value={csvData}
                readOnly
                className="min-h-32 font-mono text-sm"
              />
            </div>
          )}

          {parsedProducts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {parsedProducts.length} Products Ready
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Review the products below before uploading
                  </p>
                </div>
                <Button
                  onClick={handleBulkUpload}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Upload All Products
                    </>
                  )}
                </Button>
              </div>

              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {parsedProducts.map((product, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-start gap-4">
                      {product.imageUrl ? (
                        <ImageIcon className="h-5 w-5 text-primary mt-0.5" />
                      ) : (
                        <FileTextIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Category: {product.categoryName}</span>
                          {product.imageUrl && (
                            <span className="text-primary">• Has image</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
