import { createContext, useContext } from 'react';

type CartDrawerContextValue = {
    openCartDrawer: () => void;
};

export const CartDrawerContext = createContext<CartDrawerContextValue>({
    openCartDrawer: () => undefined,
});

export function useCartDrawer() {
    return useContext(CartDrawerContext);
}
