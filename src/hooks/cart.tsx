import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const StorageProducts = await AsyncStorage.getItem(
        '@GoMarkerPlace:CartItems',
      );
      if (StorageProducts) {
        console.log(StorageProducts);
        setProducts([...JSON.parse(StorageProducts)]);
      }
      // await AsyncStorage.removeItem('@GoMarkerPlace:CartItems');
      // setProducts([]);
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        ),
      );
      console.log(products);
      await AsyncStorage.setItem(
        '@GoMarkerPlace:CartItems',
        JSON.stringify(products),
      );
      // Minha lógica antiga
      // const cartItem = products.find(product => product.id === id);
      // if (cartItem) {
      //   const productsFiltered = products.filter(
      //     product => product.id !== cartItem.id,
      //   );
      //   cartItem.quantity += 1;
      //   setProducts([...productsFiltered, cartItem]);
      // }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const newItem = products.find(item => item.id === product.id);
      if (newItem) {
        increment(newItem.id);
        console.log('item existente');
      } else {
        const newproduct = product;
        newproduct.quantity = 1;
        setProducts([...products, newproduct]);
        console.log('novo item');
      }
      await AsyncStorage.setItem(
        '@GoMarkerPlace:CartItems',
        JSON.stringify(products),
      );
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const cartItem = products.find(product => product.id === id);
      if (cartItem) {
        const productsFiltered = products.filter(
          product => product.id !== cartItem.id,
        );
        console.log(productsFiltered);
        if (cartItem.quantity > 1) {
          cartItem.quantity -= 1;
          setProducts([...productsFiltered, cartItem]);
        } else if (productsFiltered) {
          console.log(productsFiltered);
          setProducts([]);
          console.log(products);
        } else {
          setProducts([]);
        }
        await AsyncStorage.setItem(
          '@GoMarkerPlace:CartItems',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
