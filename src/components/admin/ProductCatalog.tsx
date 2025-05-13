import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useSupabaseData,
  createSupabaseRecord,
  updateSupabaseRecord,
  deleteSupabaseRecord,
} from "@/hooks/useSupabaseData";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  stock: number;
  image?: string;
}

const ProductCatalog = () => {
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnavailable, setShowUnavailable] = useState(true);

  // Fetch products from Supabase
  const {
    data: supabaseProducts,
    loading,
    error,
    count: totalProducts,
  } = useSupabaseData<Product>({
    table: "products",
    columns: "*",
    filters: showUnavailable ? {} : { available: true },
    orderBy: { column: "name", ascending: true },
  });

  // Local state for products (used for optimistic UI updates)
  const [products, setProducts] = useState<Product[]>([]);

  // Update local state when Supabase data changes
  useEffect(() => {
    if (supabaseProducts) {
      // Transform Supabase data to match our Product interface
      const transformedProducts = supabaseProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        available: product.available,
        stock: product.stock,
        image: product.image_url,
      }));
      setProducts(transformedProducts);
    }
  }, [supabaseProducts]);

  // State for product form (add/edit)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Filter products based on search term and availability
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAvailability = showUnavailable ? true : product.available;
    return matchesSearch && matchesAvailability;
  });

  // Handle adding a new product
  const handleAddProduct = () => {
    setCurrentProduct({
      id: Date.now().toString(),
      name: "",
      description: "",
      price: 0,
      category: "",
      available: true,
      stock: 0,
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Handle editing a product
  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Handle deleting a product
  const handleDeleteProduct = (product: Product) => {
    setCurrentProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Handle saving a product (add or edit)
  const handleSaveProduct = async () => {
    if (!currentProduct) return;

    try {
      // Map to Supabase format
      const supabaseData = {
        name: currentProduct.name,
        description: currentProduct.description,
        price: currentProduct.price,
        category: currentProduct.category,
        available: currentProduct.available,
        stock: currentProduct.stock,
        image_url: currentProduct.image,
      };

      if (isEditing) {
        // Update existing product in Supabase
        await updateSupabaseRecord("products", currentProduct.id, supabaseData);
      } else {
        // Add new product to Supabase
        await createSupabaseRecord("products", supabaseData);
      }

      setIsDialogOpen(false);
      setCurrentProduct(null);
      // Data will refresh automatically via useSupabaseData
    } catch (error) {
      console.error("Error saving product:", error);
      // Could add error handling UI here
    }
  };

  // Handle confirming delete
  const handleConfirmDelete = async () => {
    if (!currentProduct) return;

    try {
      // Delete product from Supabase
      await deleteSupabaseRecord("products", currentProduct.id);

      setIsDeleteDialogOpen(false);
      setCurrentProduct(null);
      // Data will refresh automatically via useSupabaseData
    } catch (error) {
      console.error("Error deleting product:", error);
      // Could add error handling UI here
    }
  };

  // Handle toggling product availability
  const handleToggleAvailability = async (id: string) => {
    try {
      // Find the product
      const product = products.find((p) => p.id === id);
      if (!product) return;

      // Update availability in Supabase
      await updateSupabaseRecord("products", id, {
        available: !product.available,
      });

      // Data will refresh automatically via useSupabaseData
    } catch (error) {
      console.error("Error toggling product availability:", error);
      // Could add error handling UI here
    }
  };

  return (
    <div className="bg-background p-6 rounded-lg">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">
            Product Catalog {totalProducts !== null && `(${totalProducts})`}
          </CardTitle>
          <Button onClick={handleAddProduct}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="show-unavailable" className="text-sm font-medium">
                Show Unavailable
              </Label>
              <Switch
                id="show-unavailable"
                checked={showUnavailable}
                onCheckedChange={setShowUnavailable}
              />
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading products...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error loading products: {error}
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>
                      Name <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                              No img
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ${product.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.stock}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={product.available}
                              onCheckedChange={() =>
                                handleToggleAvailability(product.id)
                              }
                              className="data-[state=checked]:bg-green-500"
                            />
                            <span className="ml-2 text-sm">
                              {product.available ? "Available" : "Unavailable"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-6 text-gray-500"
                      >
                        No products found. Try adjusting your search or filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the product details below."
                : "Fill in the details for the new product."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={currentProduct?.name || ""}
                  onChange={(e) =>
                    setCurrentProduct((prev) =>
                      prev ? { ...prev, name: e.target.value } : null,
                    )
                  }
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={currentProduct?.category || ""}
                  onChange={(e) =>
                    setCurrentProduct((prev) =>
                      prev ? { ...prev, category: e.target.value } : null,
                    )
                  }
                />
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={currentProduct?.description || ""}
                onChange={(e) =>
                  setCurrentProduct((prev) =>
                    prev ? { ...prev, description: e.target.value } : null,
                  )
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={currentProduct?.price || 0}
                  onChange={(e) =>
                    setCurrentProduct((prev) =>
                      prev
                        ? { ...prev, price: parseFloat(e.target.value) }
                        : null,
                    )
                  }
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={currentProduct?.stock || 0}
                  onChange={(e) =>
                    setCurrentProduct((prev) =>
                      prev
                        ? { ...prev, stock: parseInt(e.target.value) }
                        : null,
                    )
                  }
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="available" className="mb-1">
                  Availability
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={currentProduct?.available || false}
                    onCheckedChange={(checked) =>
                      setCurrentProduct((prev) =>
                        prev ? { ...prev, available: checked } : null,
                      )
                    }
                  />
                  <span className="text-sm">
                    {currentProduct?.available ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={currentProduct?.image || ""}
                onChange={(e) =>
                  setCurrentProduct((prev) =>
                    prev ? { ...prev, image: e.target.value } : null,
                  )
                }
                placeholder="https://example.com/image.jpg"
              />
              {currentProduct?.image && (
                <div className="mt-2">
                  <img
                    src={currentProduct.image}
                    alt="Product preview"
                    className="h-20 w-20 rounded-md object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct}>
              {isEditing ? "Update" : "Add"} Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{currentProduct?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductCatalog;
