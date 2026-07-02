import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

/**
 * Fetches the current customer's orders on mount and whenever
 * the user identity changes. Only runs for "customer" role.
 */
const useGetMyOrders = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData || userData.role !== "customer") return;

    const fetchMyOrders = async () => {
      try {
        const { data } = await axios.get(`${serverUrl}/api/order/my-orders`, {
          withCredentials: true,
        });
        dispatch(setMyOrders(data));
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };

    fetchMyOrders();
  }, [userData?._id, dispatch]);
};

export default useGetMyOrders;
