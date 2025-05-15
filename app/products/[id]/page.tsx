export default async function ProductPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const data = await fetch(`https://dummyjson.com/products/${id}`);
    const product = await data.json();
    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-4">Product Details</h1>
            <div>
                <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
                <p className="mb-4">{product.description}</p>
                <img src={product.images[0]} alt={product.title} width={400} height={400} />
            </div>
        </div>
    )
}