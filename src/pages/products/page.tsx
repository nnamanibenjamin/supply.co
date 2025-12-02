import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { PackageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get("category");

  const categories = useQuery(api.categories.getActiveCategories);
  const products = useQuery(
    api.products.browseProducts,
    categoryId ? { categoryId: categoryId as Id<"categories"> } : {}
  );

  const handleCategoryChange = (value: string) => {
    if (value === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category: value });
    }
  };

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
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">Browse Products</h1>
            <p className="text-lg text-muted-foreground">
              Explore our catalog of medical equipment and supplies
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-4">
            <label className="font-medium">Filter by Category:</label>
            <Select
              value={categoryId || "all"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {products === undefined ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageIcon />
                </EmptyMedia>
                <EmptyTitle>No Products Found</EmptyTitle>
                <EmptyDescription>
                  {categoryId
                    ? "No products in this category yet"
                    : "No products available at this time"}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link key={product._id} to={`/products/${product._id}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-square overflow-hidden rounded-t-xl bg-muted">
                        {product.imageStorageIds.length > 0 ? (
                          <img
                            src={`${import.meta.env.VITE_CONVEX_URL}/api/storage/${product.imageStorageIds[0]}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PackageIcon className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="pt-4 space-y-3">
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            {product.categoryName}
                          </Badge>
                          <h3 className="font-bold text-lg line-clamp-2 mb-1">
                            {product.name}
                          </h3>
                          {product.brand && (
                            <p className="text-sm text-muted-foreground">
                              {product.brand}
                            </p>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-primary">
                            KES {product.defaultUnitPrice.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            per {product.unit}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          MOQ: {product.moq} {product.unit}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <div className="text-center text-sm text-muted-foreground pt-4">
                Showing {products.length} product{products.length !== 1 ? "s" : ""}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
