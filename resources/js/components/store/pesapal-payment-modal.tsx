import * as Dialog from '@radix-ui/react-dialog';
import {
    ExternalLink,
    LoaderCircle,
    LockKeyhole,
    ShieldCheck,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';

type PesapalPaymentModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPaymentReturn: () => void;
    orderNumber: string;
    url: string;
};

export function PesapalPaymentModal({
    open,
    onOpenChange,
    onPaymentReturn,
    orderNumber,
    url,
}: PesapalPaymentModalProps) {
    const frameRef = useRef<HTMLIFrameElement>(null);
    const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
    const loading = loadedUrl !== url;

    const handleFrameLoad = () => {
        setLoadedUrl(url);

        try {
            const frameLocation = frameRef.current?.contentWindow?.location;

            if (frameLocation?.origin === window.location.origin) {
                onPaymentReturn();
            }
        } catch {
            return;
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[110] bg-stone-950/65 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content className="bg-ivory text-ink fixed inset-0 z-[120] flex flex-col overflow-hidden outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:inset-5 sm:rounded-sm sm:border sm:border-white/20 sm:shadow-[0_35px_120px_rgba(0,0,0,.38)] lg:inset-y-8 lg:right-auto lg:left-1/2 lg:w-[min(980px,calc(100vw-64px))] lg:-translate-x-1/2">
                    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-brand-pink/70 bg-brand-blush px-4 py-3 sm:px-6 sm:py-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[.2em] text-stone-500 uppercase">
                                <LockKeyhole size={13} /> Secure checkout
                            </div>
                            <Dialog.Title className="mt-1 truncate font-serif text-xl tracking-[-.02em] sm:text-2xl">
                                Complete payment
                            </Dialog.Title>
                            <Dialog.Description className="mt-0.5 text-xs text-stone-500">
                                Order {orderNumber} · Powered by Pesapal
                            </Dialog.Description>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="hidden h-10 items-center gap-2 border border-black/10 bg-white/60 px-3 text-[10px] font-semibold tracking-wider uppercase transition hover:border-black/35 hover:bg-white sm:flex"
                            >
                                <ExternalLink size={13} /> New tab
                            </a>
                            <Dialog.Close
                                className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/60 transition hover:border-black/35 hover:bg-white"
                                aria-label="Close payment window"
                            >
                                <X size={17} />
                            </Dialog.Close>
                        </div>
                    </header>

                    <div className="relative min-h-0 flex-1 bg-white">
                        {loading && (
                            <div className="absolute inset-0 z-10 grid place-items-center bg-white">
                                <div className="text-center">
                                    <LoaderCircle
                                        size={28}
                                        className="mx-auto animate-spin text-stone-500"
                                    />
                                    <p className="mt-4 text-xs font-semibold tracking-[.18em] text-stone-500 uppercase">
                                        Connecting to Pesapal
                                    </p>
                                </div>
                            </div>
                        )}
                        <iframe
                            ref={frameRef}
                            src={url}
                            title={`Pesapal payment for order ${orderNumber}`}
                            className="h-full w-full border-0 bg-white"
                            allow="payment *; clipboard-write *"
                            referrerPolicy="strict-origin-when-cross-origin"
                            onLoad={handleFrameLoad}
                        />
                    </div>

                    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-brand-pink/70 bg-brand-blush px-4 py-3 text-[10px] tracking-wide text-stone-500 sm:px-6">
                        <span className="flex items-center gap-2">
                            <ShieldCheck size={14} /> Your payment is handled by
                            Pesapal.
                        </span>
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-stone-700 underline underline-offset-4 sm:hidden"
                        >
                            Open separately
                        </a>
                    </footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
