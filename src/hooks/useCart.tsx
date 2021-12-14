import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const findedProduct = updatedCart.find(product => product.id === productId);

      const response = await api.get(`/stock/${productId}`);

      const newAmount = findedProduct ? response.data.amount + 1 : 1;

      if (newAmount > response.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (findedProduct) {
        findedProduct.amount = newAmount;
      } else {
        const response = await api.get(`/products/${productId}`);
        const newItemToCart = { ...response.data, amount: 1 };

        updatedCart.push(newItemToCart);
      }

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Não foi possível adicionar o produto ao carrinho de compras.');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const findedProduct = updatedCart.find(product => product.id === productId);

      if (findedProduct) {
        const index = updatedCart.indexOf(findedProduct);
        updatedCart.splice(index, 1);


        setCart(updatedCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

      } else {
        throw Error();
      }

    } catch {
      toast.error('Não foi possível remover o produto do carrinho de compras.');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedCart = [...cart];
      const findedProduct = updatedCart.find(product => product.id === productId);

      const response = await api.get(`/stock/${productId}`);

      if (!findedProduct) {
        return;
      }

      if (response.data.amount >= amount) {
        findedProduct.amount = amount;

        setCart(updatedCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      } else {
        toast.error('Quantidade solicitada fora de estoque.');
      }
    } catch {
      toast.error('Não foi possível atualizar o produto no carrinho de compras.');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
