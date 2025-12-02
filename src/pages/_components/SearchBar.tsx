import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Input } from "@/components/ui/input.tsx";
import { Card } from "@/components/ui/card.tsx";
import { SearchIcon, PlusCircleIcon, PackageIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function SearchBar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  const searchResults = useQuery(
    api.products.searchProducts,
    debouncedQuery && debouncedQuery.trim() ? { query: debouncedQuery, limit: 5 } : "skip"
  );

  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      setShowSuggestions(true);
    }
  }, [searchResults]);

  const handleProductClick = (productId: Id<"products">) => {
    setShowSuggestions(false);
    setSearchQuery("");
    navigate(`/products/${productId}`);
  };

  const handleCreateCustomRFQ = () => {
    setShowSuggestions(false);
    navigate("/rfq/create");
  };

  return (
    <div className="relative">
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
      <Input
        placeholder="Search for medical equipment, supplies, pharmaceuticals..."
        className="pl-12 pr-4 py-6 text-lg"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => searchQuery && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />

      {/* Search Suggestions */}
      {showSuggestions && searchQuery.trim() && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto">
          {searchResults === undefined ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                No products found for "{searchQuery}"
              </p>
              <button
                onClick={handleCreateCustomRFQ}
                className="w-full p-3 hover:bg-muted rounded-lg transition-colors flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <PlusCircleIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Can't find your product?</p>
                  <p className="text-xs text-muted-foreground">
                    Create a custom RFQ
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <div className="p-2">
              {searchResults.map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleProductClick(product._id)}
                  className="w-full p-3 hover:bg-muted rounded-lg transition-colors flex items-center gap-3 text-left"
                >
                  {product.imageStorageIds.length > 0 ? (
                    <img
                      src={`${import.meta.env.VITE_CONVEX_URL}/api/storage/${product.imageStorageIds[0]}`}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <PackageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      KES {product.defaultUnitPrice.toLocaleString()} per {product.unit}
                    </p>
                  </div>
                </button>
              ))}
              <button
                onClick={handleCreateCustomRFQ}
                className="w-full p-3 hover:bg-muted rounded-lg transition-colors flex items-center gap-3 text-left mt-2 border-t"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <PlusCircleIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Create custom RFQ</p>
                  <p className="text-xs text-muted-foreground">
                    Request a product not listed
                  </p>
                </div>
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
