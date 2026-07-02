import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setItemsInMyCity } from "../redux/userSlice";
import { serverUrl } from "../App";

/**
 * Fetches menu items belonging to the restaurant in the user's detected city.
 */
const useGetItemsByCity = () => {
  const dispatch = useDispatch();
  const { currentCity, userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!currentCity || !userData || userData.role !== "customer") return;

    const fetchItems = async () => {
      try {
        const { data } = await axios.get(
          `${serverUrl}/api/item/get-by-city/${currentCity}`,
          { withCredentials: true }
        );
        dispatch(setItemsInMyCity(data));
      } catch (error) {
        console.error("Error fetching items by city:", error);
      }
    };

    fetchItems();
  }, [currentCity, userData?._id, dispatch]);
};

export default useGetItemsByCity;
