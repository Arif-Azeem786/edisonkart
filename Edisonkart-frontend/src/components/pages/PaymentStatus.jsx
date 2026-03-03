import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight, ShoppingBag, Receipt, Home, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { getPaymentStatus } from '../../services/payment';
import { motion } from 'framer-motion';
import useCartStore from '../../store/cartStore';

const MAX_RETRIES = 8;
const POLL_INTERVAL = 3000; // 3 seconds

const PaymentStatus = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order_id');
    const [status, setStatus] = useState('loading'); // loading, success, failed, pending
    const [details, setDetails] = useState(null);
    const { fetchCart } = useCartStore();
    const retryCount = useRef(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!orderId) {
            setStatus('failed');
            return;
        }

        const checkStatus = async () => {
            try {
                const data = await getPaymentStatus(orderId);
                setDetails(data);

                if (data.status === 'SUCCESS') {
                    setStatus('success');
                    fetchCart(); // Refresh cart to show empty state
                } else if (data.status === 'FAILED') {
                    setStatus('failed');
                } else {
                    // PENDING — retry if we haven't exhausted retries
                    retryCount.current += 1;
                    if (retryCount.current < MAX_RETRIES) {
                        timerRef.current = setTimeout(checkStatus, POLL_INTERVAL);
                    } else {
                        // After all retries, show pending UI
                        setStatus('pending');
                    }
                }
            } catch (error) {
                retryCount.current += 1;
                if (retryCount.current < MAX_RETRIES) {
                    timerRef.current = setTimeout(checkStatus, POLL_INTERVAL);
                } else {
                    setStatus('failed');
                }
            }
        };

        checkStatus();
        return () => clearTimeout(timerRef.current);
    }, [orderId, fetchCart]);

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] bg-background gap-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                    <Loader2 className="h-16 w-16 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold">Verifying Payment...</h2>
                <p className="text-muted-foreground text-sm">Please wait while we confirm your transaction.</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-muted/20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md w-full bg-card rounded-3xl shadow-xl overflow-hidden border border-border/50"
                >
                    <div className="bg-primary/5 p-8 text-center border-b border-border/50 relative overflow-hidden">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
                        >
                            <CheckCircle className="h-12 w-12 text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Payment Successful!</h1>
                        <p className="text-muted-foreground text-sm">Thank you for your purchase.</p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-xl border border-border/50 border-dashed">
                                <div className="p-2 bg-background rounded-lg border border-border/50">
                                    <Receipt className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="text-sm">
                                    <p className="text-muted-foreground">Order ID</p>
                                    <p className="font-mono font-semibold">{orderId}</p>
                                </div>
                            </div>
                            {details && (
                                <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-xl border border-border/50 border-dashed">
                                    <div className="p-2 bg-background rounded-lg border border-border/50">
                                        <span className="text-lg font-bold text-muted-foreground">₹</span>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-muted-foreground">Amount Paid</p>
                                        <p className="font-bold text-lg">₹{details.amount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            A confirmation email has been sent to your registered email address.
                        </p>
                        <div className="space-y-3 pt-2">
                            <Link to="/orders">
                                <Button className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20">
                                    Track Order <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <div className="grid grid-cols-2 gap-3">
                                <Link to="/products">
                                    <Button variant="outline" className="w-full rounded-xl h-11">
                                        <ShoppingBag className="mr-2 h-4 w-4" /> Shop More
                                    </Button>
                                </Link>
                                <Link to="/">
                                    <Button variant="outline" className="w-full rounded-xl h-11">
                                        <Home className="mr-2 h-4 w-4" /> Home
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (status === 'pending') {
        return (
            <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-muted/20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-card rounded-3xl shadow-xl overflow-hidden border border-yellow-200/50"
                >
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-8 text-center border-b border-yellow-100 dark:border-yellow-900/30">
                        <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600">
                            <Clock className="h-12 w-12" />
                        </div>
                        <h1 className="text-3xl font-bold text-yellow-700 dark:text-yellow-400 mb-2">Payment Processing</h1>
                        <p className="text-muted-foreground">Your payment is being verified.</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <p className="text-center text-muted-foreground">
                            Your order <span className="font-mono font-semibold text-foreground">{orderId}</span> has been placed. Payment confirmation may take a few minutes. Check your orders page for the latest status.
                        </p>
                        <div className="space-y-3">
                            <Link to="/orders">
                                <Button className="w-full h-12 rounded-xl text-base font-semibold">
                                    View My Orders <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link to="/">
                                <Button variant="outline" className="w-full rounded-xl h-11">
                                    <Home className="mr-2 h-4 w-4" /> Back to Home
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Failed state
    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-muted/20">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-card rounded-3xl shadow-xl overflow-hidden border border-destructive/20"
            >
                <div className="bg-destructive/5 p-8 text-center border-b border-destructive/10">
                    <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 text-destructive">
                        <XCircle className="h-12 w-12" />
                    </div>
                    <h1 className="text-3xl font-bold text-destructive mb-2">Payment Failed</h1>
                    <p className="text-muted-foreground">We couldn't process your transaction.</p>
                </div>
                <div className="p-8 space-y-6">
                    <p className="text-center text-muted-foreground">
                        This might be due to a network issue or insufficient funds. No money has been deducted from your account.
                    </p>
                    <div className="space-y-3">
                        <Link to="/cart">
                            <Button className="w-full h-12 rounded-xl text-base font-semibold bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20">
                                Try Again
                            </Button>
                        </Link>
                        <Link to="/contact">
                            <Button variant="outline" className="w-full rounded-xl h-11">
                                Contact Support
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentStatus;
