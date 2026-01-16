import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Loader2Icon, ArrowLeftIcon, UploadIcon, DownloadIcon, FileTextIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea.tsx";

interface CategoryRow {
  name: string;
  description?: string;
}

export default function BulkUploadCategoriesPage() {
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState("");
  const [parsedCategories, setParsedCategories] = useState<CategoryRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentUser = useQuery(api.registration.getCurrentUser);
  const bulkCreate = useMutation(api.categories.bulkCreate);

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

      if (nameIndex === -1) {
        toast.error("CSV must have 'name' column");
        return;
      }

      const categories: CategoryRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        if (values[nameIndex]) {
          categories.push({
            name: values[nameIndex],
            description: descriptionIndex !== -1 && values[descriptionIndex] 
              ? values[descriptionIndex] 
              : undefined,
          });
        }
      }

      setParsedCategories(categories);
      toast.success(`Parsed ${categories.length} categories from CSV`);
    } catch (error) {
      toast.error("Failed to parse CSV file");
      console.error(error);
    }
  };

  const handleBulkUpload = async () => {
    if (parsedCategories.length === 0) return;

    setIsProcessing(true);
    try {
      const result = await bulkCreate({ categories: parsedCategories });

      toast.success(
        `Successfully created ${result.created} category(ies)${
          result.skipped > 0 ? `, skipped ${result.skipped} duplicate(s)` : ""
        }`
      );
      navigate("/admin/categories");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create categories");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = "name,description\nSurgical Equipment,Equipment used in surgical procedures\nMedical Devices,General medical devices and instruments\nLaboratory Equipment,Equipment for laboratory testing and analysis";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "category-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (currentUser === undefined) {
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
          <CardDescription>Only administrators can bulk upload categories</CardDescription>
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
        <Link to="/admin/categories">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Bulk Upload Categories</h1>
        <p className="text-muted-foreground">
          Upload multiple categories at once using a CSV file
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Upload a CSV file with columns: name (required), description (optional)
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

          {parsedCategories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {parsedCategories.length} Categories Ready
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Review the categories below before uploading
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
                      Upload All Categories
                    </>
                  )}
                </Button>
              </div>

              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {parsedCategories.map((category, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-start gap-4">
                      <FileTextIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium">{category.name}</h4>
                        {category.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {category.description}
                          </p>
                        )}
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
