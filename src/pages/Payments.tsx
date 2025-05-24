
// Deprecated Payment experience; see PaymentsHome, SendPayment, TopUpWallet, and ReceivedPaymentsMobile for new mobile flow.
import { Navigate } from "react-router-dom";

const Payments = () => {
  return <Navigate to="/payments/home" />;
};

export default Payments;
