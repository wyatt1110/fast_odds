import { supabase } from '@/lib/supabase';

export interface TrackImageAssignment {
  trackName: string;
  imageUrl: string;
  imageName: string;
}

// Get current UK date for consistent daily seeding
const getCurrentUKRaceDate = (): string => {
  const now = new Date();
  const ukTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
  
  if (ukTime.getHours() === 0 && ukTime.getMinutes() < 30) {
    const yesterday = new Date(ukTime);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  
  return ukTime.toISOString().split('T')[0];
};

// Simple seeded random number generator
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Create a daily seed based on track name and date
const createDailySeed = (trackName: string, date: string): number => {
  let hash = 0;
  const str = `${trackName}-${date}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Fetch all available racing photos from Supabase storage
const fetchAvailableImages = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase.storage
      .from('random-racing-photos')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Error fetching racing images:', error);
      return [];
    }

    // Filter for image files only
    const imageFiles = data
      ?.filter(file => 
        file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/i)
      )
      .map(file => file.name) || [];

    console.log(`Found ${imageFiles.length} racing images in storage`);
    return imageFiles;
  } catch (error) {
    console.error('Error accessing racing images storage:', error);
    return [];
  }
};

// Get public URL for an image
const getImageUrl = (imageName: string): string => {
  const { data } = supabase.storage
    .from('random-racing-photos')
    .getPublicUrl(imageName);
  
  return data.publicUrl;
};

// Get a random image for a single track
export const getRandomTrackImage = async (trackName: string): Promise<string> => {
  const availableImages = await fetchAvailableImages();
  
  if (availableImages.length === 0) {
    return '/images/fallback-track.jpg'; // Fallback image
  }
  
  const currentDate = getCurrentUKRaceDate();
  const seed = createDailySeed(trackName, currentDate);
  const randomValue = seededRandom(seed);
  const imageIndex = Math.floor(randomValue * availableImages.length);
  
  const selectedImage = availableImages[imageIndex];
  return getImageUrl(selectedImage);
};

// Get image assignments for multiple tracks ensuring no duplicates
export const getTrackImageAssignments = async (trackNames: string[]): Promise<TrackImageAssignment[]> => {
  if (trackNames.length === 0) {
    return [];
  }
  
  const availableImages = await fetchAvailableImages();
  
  if (availableImages.length === 0) {
    // Return fallback assignments
    return trackNames.map(trackName => ({
      trackName,
      imageUrl: '/images/fallback-track.jpg',
      imageName: 'fallback-track.jpg'
    }));
  }
  
  const currentDate = getCurrentUKRaceDate();
  const assignments: TrackImageAssignment[] = [];
  const usedIndices = new Set<number>();
  
  // Sort track names for consistent ordering
  const sortedTrackNames = [...trackNames].sort();
  
  for (const trackName of sortedTrackNames) {
    let imageIndex: number;
    let attempts = 0;
    const maxAttempts = availableImages.length * 2; // Prevent infinite loop
    
    do {
      const seed = createDailySeed(trackName, currentDate) + attempts;
      const randomValue = seededRandom(seed);
      imageIndex = Math.floor(randomValue * availableImages.length);
      attempts++;
    } while (usedIndices.has(imageIndex) && attempts < maxAttempts);
    
    // If we couldn't find a unique image, use the calculated one anyway
    usedIndices.add(imageIndex);
    
    const selectedImage = availableImages[imageIndex];
    assignments.push({
      trackName,
      imageUrl: getImageUrl(selectedImage),
      imageName: selectedImage
    });
  }
  
  console.log(`Assigned ${assignments.length} unique images for ${trackNames.length} tracks on ${currentDate}`);
  return assignments;
};

// Preload images for better performance
export const preloadTrackImages = (imageUrls: string[]): void => {
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

// Get debug info for image assignments
export const getImageAssignmentDebugInfo = async (trackNames: string[]) => {
  const currentDate = getCurrentUKRaceDate();
  const availableImages = await fetchAvailableImages();
  
  return {
    currentDate,
    totalAvailableImages: availableImages.length,
    requestedTracks: trackNames.length,
    availableImages: availableImages.slice(0, 10), // First 10 for debugging
  };
}; 