"use client";

import React from 'react';
import { Button } from './ui/button';
import Link from 'next/link';
export default function Product( { products , categories }: { products: any , categories: any } ) {
    const [filter , setFilter] = React.useState('')

   const filterProducts = products.filter((product: any) => {
        if (filter === '') return true; // No filter applied, show all products
        return product.category === filter; // Filter by category
      });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Products</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((category: any) => (
          <Button
            key={category?.slug}
            className="cursor-pointer"
            onClick={() =>
              setFilter((prev) =>
                prev === category?.slug ? "" : category?.slug
              )
            }
          >
            {category?.name}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filterProducts.map((product: any) => (
          <Link href={`/products/${product.id}`} key={product.id}>
            <div
              key={product.id}
              className="border p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <h2 className="text-xl font-bold">{product.title}</h2>
              <p className="text-gray-700">{product.description}</p>
              <img
                src={product?.thumbnail}
                alt={product.title}
                width={200}
                height={200}
                className="w-full h-auto"
              />
              <p className="text-lg font-semibold">${product?.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}