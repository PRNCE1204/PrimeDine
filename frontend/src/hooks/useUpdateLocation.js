import { useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { serverUrl } from "../App";

/**
 * Periodically updates the user's geolocation on the server.
 * Used for proximity-based features. Currently a lightweight stub —
 * only runs for "customer" role.
 */
const useUpdateLocation = () => {
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData || userData.role !== "customer") return;
    if (!navigator.geolocation) return;

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            await axios.post(
              `${serverUrl}/api/user/update-location`,
              { lat: latitude, lon: longitude },
              { withCredentials: true }
            );
          } catch (err) {
            // Silently fail — location update is non-critical
          }
        },
        () => {} // Permission denied — ignore
      );
    };

    updateLocation();
  }, [userData?._id]);
};

export default useUpdateLocation;
