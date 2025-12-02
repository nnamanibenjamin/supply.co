import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { PackageIcon } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const product = useQuery(api.products.getProduct, id ? { productId: id as Id<"products"> } : "skip");

  if (product === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50">
          <div className="container mx-auto px-4 py-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold">saline.co.ke</span>
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50">
          <div className="container mx-auto px-4 py-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold">saline.co.ke</span>
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Product Not Found</CardTitle>
              <CardDescription>The product you're looking for doesn't exist</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/">
                <Button>Return Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold">saline.co.ke</span>
          </Link>
          <Link to="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              {product.imageStorageIds.length > 0 ? (
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={`${import.meta.env.VITE_CONVEX_URL}/api/storage/${product.imageStorageIds[0]}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <PackageIcon className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
              {product.imageStorageIds.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.imageStorageIds.slice(1, 5).map((imageId, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={`${import.meta.env.VITE_CONVEX_URL}/api/storage/${imageId}`}
                        alt={`${product.name} ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {product.category?.name}
                </Badge>
                <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
                {product.brand && (
                  <p className="text-lg text-muted-foreground">Brand: {product.brand}</p>
                )}
                {product.modelSku && (
                  <p className="text-sm text-muted-foreground">Model/SKU: {product.modelSku}</p>
                )}
                {product.supplier && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Supplied by <span className="font-medium">{product.supplier.companyName}</span>
                  </p>
                )}
              </div>

              <div className="border-y py-4">
                <div className="text-3xl font-bold text-primary">
                  KES {product.defaultUnitPrice.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">per {product.unit}</p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">MOQ</p>
                    <p className="text-lg font-semibold">{product.moq} {product.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery Time</p>
                    <p className="text-lg font-semibold">{product.deliveryTime}</p>
                  </div>
                </div>

                {product.countryOfOrigin && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Country of Origin</p>
                    <p className="text-lg font-semibold">{product.countryOfOrigin}</p>
                  </div>
                )}

                {product.warranty && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Warranty</p>
                    <p className="text-lg font-semibold">{product.warranty}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Link to={`/rfq/create?productId=${id}`}>
                  <Button size="lg" className="w-full">Request for Quotation (RFQ)</Button>
                </Link>
              </div>

              <div className="bg-muted/50 border rounded-lg p-4 text-sm text-muted-foreground">
                <strong>Important:</strong> saline.co.ke only facilitates connection between hospitals and suppliers. It does not handle payments, deliveries, or contractual obligations.
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Product Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Specifications */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Category</span>
                  <span className="text-muted-foreground">{product.category?.name}</span>
                </div>
                {product.brand && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Brand</span>
                    <span className="text-muted-foreground">{product.brand}</span>
                  </div>
                )}
                {product.modelSku && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Model/SKU</span>
                    <span className="text-muted-foreground">{product.modelSku}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Unit</span>
                  <span className="text-muted-foreground">{product.unit}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">MOQ</span>
                  <span className="text-muted-foreground">{product.moq} {product.unit}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Delivery Time</span>
                  <span className="text-muted-foreground">{product.deliveryTime}</span>
                </div>
                {product.countryOfOrigin && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Country of Origin</span>
                    <span className="text-muted-foreground">{product.countryOfOrigin}</span>
                  </div>
                )}
                {product.warranty && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Warranty</span>
                    <span className="text-muted-foreground">{product.warranty}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
