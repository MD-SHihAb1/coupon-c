import { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "http://localhost:5000";

function App() {
    const [coupon, setCoupon] = useState(null);
    const [message, setMessage] = useState("");
    const [isClaimed, setIsClaimed] = useState(false);
    const [cooldown, setCooldown] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        // Check if user has already claimed the coupon
        axios.get(`${API_URL}/check-claim`, { withCredentials: true })
            .then(res => {
                if (res.data.isClaimed) {
                    setIsClaimed(true);
                    setCoupon(res.data.coupon); // Set the coupon if already claimed

                    // Check the cooldown status (time left)
                    const lastClaimTime = new Date(res.data.timestamp);
                    const currentTime = new Date();
                    const diffInMilliseconds = currentTime - lastClaimTime;
                    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

                    if (diffInMilliseconds < oneHour) {
                        setCooldown(true);
                        setTimeLeft(Math.floor((oneHour - diffInMilliseconds) / 1000)); // Convert to seconds
                    }
                }
            })
            .catch(err => {
                console.error(err);
            });
    }, []);

    useEffect(() => {
        // If the cooldown timer is active, update every second
        let interval;
        if (cooldown && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && cooldown) {
            setCooldown(false);
        }
        return () => clearInterval(interval);
    }, [cooldown, timeLeft]);

    const claimCoupon = () => {
        axios.post(`${API_URL}/claim`, {}, { withCredentials: true })
            .then(res => {
                toast.success(res.data.message);
                setIsClaimed(true);
                setCoupon(res.data.coupon);
                setCooldown(true); // Start the cooldown after claiming

                // Delay clipboard copy by 2 seconds
                setTimeout(() => {
                    navigator.clipboard.writeText(res.data.coupon);
                    toast.info("Coupon copied to clipboard!");
                }, 2000);
            })
            .catch(err => {
                toast.error(err.response.data.message);
                if (err.response.data.message === "You have already claimed a coupon.") {
                    setIsClaimed(true);
                    setCoupon(err.response.data.coupon); // Show the claimed coupon
                    setCooldown(true); // Start the cooldown if coupon already claimed
                }
            });
    };

    const copyToClipboard = (coupon) => {
        navigator.clipboard.writeText(coupon);
        toast.info("Coupon copied to clipboard!");
    };

    return (
        <div className="app-container">
            <ToastContainer />
            <div className="coupon-container">
                <h1 className="heading">Round-Robin Coupon Distribution</h1>
                {isClaimed ? (
                    <div className="coupon-info">
                        <p>
                            You have already claimed a coupon. Your Coupon: 
                            <span className="coupon-code" onClick={() => copyToClipboard(coupon)}>
                                {coupon}
                            </span>
                        </p>
                        {cooldown && timeLeft > 0 && (
                            <p>Wait for {timeLeft} seconds to claim again.</p>
                        )}
                    </div>
                ) : (
                    <p className="message">{message || "Click the button to claim a coupon."}</p>
                )}
                {!isClaimed && !cooldown && (
                    <button 
                        onClick={claimCoupon} 
                        className="claim-button"
                    >
                        Claim Coupon
                    </button>
                )}
            </div>
        </div>
    );
}

export default App;
