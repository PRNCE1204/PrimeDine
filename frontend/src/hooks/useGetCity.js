import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrentCity } from "../redux/userSlice";

/**
 * Detects the user's city via the browser Geolocation API and
 * a free reverse-geocoding endpoint, then stores it in Redux.
 */
const useGetCity = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "Unknown";
          dispatch(setCurrentCity(city));
        } catch (err) {
          console.error("Reverse geocode failed:", err);
        }
      },
      () => {
        // Permission denied or error — use a default city
        dispatch(setCurrentCity(""));
      }
    );
  }, [dispatch]);
};

export default useGetCity;
