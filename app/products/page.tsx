// import Image from "next/image"

import Product from "@/components/Product"

export default async function Products() {
 const data = await fetch("https://dummyjson.com/products?limit=100");
 const products = await data.json();
 const categoriesData = await fetch(
   "https://dummyjson.com/products/categories"
 );
 const categories = await categoriesData.json();
 console.log("Products page loaded");
    return (
      <div className=" p-4">  
        <Product products={products.products} categories={categories} />
      </div>
    );
}