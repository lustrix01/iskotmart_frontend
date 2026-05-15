import { useEffect, useMemo, useState } from "react";
import { CartContext } from "./cartContextObject";

const STORAGE_KEY = "iskotmart_cart_v1";

const makeInitialCart = () => ({
  product: [],
  service: [],
});

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return makeInitialCart();
      const parsed = JSON.parse(raw);
      return {
        product: Array.isArray(parsed.product) ? parsed.product : [],
        service: Array.isArray(parsed.service) ? parsed.service : [],
      };
    } catch {
      return makeInitialCart();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (type, nextItem, qty = 1) => {
    if (!nextItem || (type !== "product" && type !== "service")) return;
    const quantity = Math.max(1, Number(qty || 1));

    setCart((prev) => {
      const existing = prev[type];
      const matchIndex = existing.findIndex(
        (item) => Number(item.id) === Number(nextItem.id),
      );

      if (matchIndex >= 0) {
        const updated = [...existing];
        const previousQty = Number(updated[matchIndex].qty || 1);
        updated[matchIndex] = {
          ...updated[matchIndex],
          ...nextItem,
          qty: previousQty + quantity,
        };
        return { ...prev, [type]: updated };
      }

      return {
        ...prev,
        [type]: [...existing, { ...nextItem, qty: quantity }],
      };
    });
  };

  const updateItemQty = (type, id, qty) => {
    if (type !== "product" && type !== "service") return;
    const quantity = Math.max(1, Number(qty || 1));
    setCart((prev) => ({
      ...prev,
      [type]: prev[type].map((item) =>
        Number(item.id) === Number(id) ? { ...item, qty: quantity } : item,
      ),
    }));
  };

  const removeFromCart = (type, id) => {
    if (type !== "product" && type !== "service") return;
    setCart((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => Number(item.id) !== Number(id)),
    }));
  };

  const clearCartType = (type) => {
    if (type !== "product" && type !== "service") return;
    setCart((prev) => ({ ...prev, [type]: [] }));
  };

  const value = useMemo(
    () => ({
      productItems: cart.product,
      serviceItems: cart.service,
      addToCart,
      updateItemQty,
      removeFromCart,
      clearCartType,
    }),
    [cart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

