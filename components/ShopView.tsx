import { getCatalog } from "@/lib/backend";
import Header from "./Header";
import Shop, { type ShopCategory } from "./Shop";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import Cursor from "./Cursor";
import ShopCartBar from "./ShopCartBar";

// La stessa struttura per lo shop completo e per le pagine Barrette e Integratore.
export default async function ShopView({ category }: { category?: ShopCategory }) {
  const products = await getCatalog();
  return (
    <>
      <Cursor />
      <Header />
      <main>
        <Shop products={products} category={category} />
      </main>
      <Footer />
      <ShopCartBar />
      <CartDrawer />
    </>
  );
}
