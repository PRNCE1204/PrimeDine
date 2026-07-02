import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMyShopData } from "../redux/ownerSlice";
import { serverUrl } from "../App";

/**
 * Fetches the shop owned by the currently logged-in admin user
 * and stores it in the owner Redux slice.
 */
const useGetMyShop = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData || userData.role !== "admin") return;

    const fetchMyShop = async () => {
      try {
        const { data } = await axios.get(`${serverUrl}/api/shop/get-my`, {
          withCredentials: true,
        });
        dispatch(setMyShopData(data));
      } catch (error) {
        dispatch(setMyShopData(null));
      }
    };

    fetchMyShop();
  }, [userData?._id, dispatch]);
};

export default useGetMyShop;
