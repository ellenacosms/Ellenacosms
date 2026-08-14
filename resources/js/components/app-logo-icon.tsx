import type { ComponentPropsWithoutRef } from 'react';

export default function AppLogoIcon(props: ComponentPropsWithoutRef<'img'>) {
    return <img src="/brand-logo.png?v=2" alt="Ellena" {...props} />;
}
