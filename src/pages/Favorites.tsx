import { useState, useEffect } from "react";
import { Heart, Star, MapPin, ArrowLeft, Calendar, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface FavoriteGround {
  _id: string;
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
  };
  price: {
    perHour: number;
  };
  rating: {
    average: number;
    count: number;
  };
  features: {
    capacity: number;
    pitchType: string;
    lighting: boolean;
    parking: boolean;
  };
  images: Array<{
    url: string;
    alt?: string;
  }>;
  availability?: {
    isAvailable: boolean;
    nextSlot?: string;
  };
}

const Favorites = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteGround[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated]);

  // Listen for localStorage changes to sync favorites
  useEffect(() => {
    const handleStorageChange = () => {
      if (isAuthenticated) {
        fetchFavorites();
      }
    };

    // Listen for storage changes from other tabs/components
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from the same tab
    window.addEventListener('favoritesChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesChanged', handleStorageChange);
    };
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      
      // Read favorites from localStorage
      const savedFavorites = localStorage.getItem('boxcric_favorites');
      if (savedFavorites) {
        const favoritesList = JSON.parse(savedFavorites);
        setFavorites(favoritesList);
      } else {
        setFavorites([]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      toast.error("Failed to load your favorites");
      setFavorites([]);
      setIsLoading(false);
    }
  };

  const removeFavorite = async (groundId: string) => {
    try {
      // Update localStorage
      const savedFavorites = localStorage.getItem('boxcric_favorites');
      if (savedFavorites) {
        const favoritesList = JSON.parse(savedFavorites);
        const updatedFavorites = favoritesList.filter((fav: FavoriteGround) => fav._id !== groundId);
        localStorage.setItem('boxcric_favorites', JSON.stringify(updatedFavorites));
      }
      
      // Update state
      setFavorites(prev => prev.filter(fav => fav._id !== groundId));
      toast.success("Removed from favorites");
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      toast.error("Failed to remove from favorites");
    }
  };

  const handleBookGround = (groundId: string) => {
    navigate(`/ground/${groundId}`);
  };

  const handleViewDetails = (groundId: string) => {
    navigate(`/ground/${groundId}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-grass-light via-white to-sky-blue/10">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Please login to view your favorites
              </h3>
              <p className="text-gray-600 mb-4">
                You need to be logged in to access your favorite grounds.
              </p>
              <Button 
                className="bg-cricket-green hover:bg-cricket-green/90"
                onClick={() => navigate("/")}
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-grass-light via-white to-sky-blue/10">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/profile")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Profile</span>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <Heart className="w-8 h-8 text-red-500" />
              <span>Favorite Grounds</span>
            </h1>
          </div>
          <Button 
            className="bg-cricket-green hover:bg-cricket-green/90"
            onClick={() => navigate("/")}
          >
            Discover More Grounds
          </Button>
        </div>

        {/* Favorites Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((ground) => (
              <Card key={ground._id} className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative">
                  <img
                    src={ground.images?.[0]?.url || "/placeholder.svg"}
                    alt={ground.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeFavorite(ground._id)}
                      className="bg-red-500/80 hover:bg-red-600 backdrop-blur-sm"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
                  </div>
                  {ground.availability && (
                    <div className="absolute top-3 left-3">
                      <Badge 
                        className={ground.availability.isAvailable 
                          ? "bg-green-500 text-white" 
                          : "bg-red-500 text-white"
                        }
                      >
                        {ground.availability.isAvailable ? "Available" : "Busy"}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-cricket-green transition-colors">
                        {ground.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">{ground.location.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{ground.rating.average}</span>
                        <span className="text-sm text-gray-600">({ground.rating.count})</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-cricket-green">
                          ₹{ground.price.perHour}/hour
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{ground.features.capacity} players</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {ground.features.lighting && (
                          <Badge variant="outline" className="text-xs">
                            Lights
                          </Badge>
                        )}
                        {ground.features.parking && (
                          <Badge variant="outline" className="text-xs">
                            Parking
                          </Badge>
                        )}
                      </div>
                    </div>

                    {ground.availability?.nextSlot && (
                      <div className="flex items-center text-sm text-green-600 bg-green-50 p-2 rounded">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Next available: {ground.availability.nextSlot}</span>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(ground._id)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleBookGround(ground._id)}
                        className="flex-1 bg-cricket-green hover:bg-cricket-green/90"
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-16 text-center">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                No favorites yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start exploring cricket grounds and add them to your favorites for quick access. 
                Click the heart icon on any ground to save it here!
              </p>
              <div className="space-y-3">
                <Button
                  className="bg-cricket-green hover:bg-cricket-green/90"
                  onClick={() => navigate("/")}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Discover Grounds
                </Button>
                <div className="text-sm text-gray-500">
                  Or browse by{" "}
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-cricket-green"
                    onClick={() => navigate("/")}
                  >
                    location
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Favorites;
