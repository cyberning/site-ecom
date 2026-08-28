"use client";

import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

export default function ProductEditPage() {
  const params = useParams();
  const id = params.id as string;

  // "new" is handled by the dedicated /new route,
  // but if someone navigates here with id=new, treat it as new
  const productId = id === "new" ? null : id;

  return <ProductForm productId={productId} />;
}
