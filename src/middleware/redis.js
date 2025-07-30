import redis from '../config/redis';

export const getAndSetCache = (cachePrefix, cacheDuration = 900) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const query = req.query;
            const {restaurantId} = req.params;
            if (!redis) {
                console.warn('Redis client not initialized');
                return next();
            }

            const userKey = user ? `user:${user.type}:${user.id}` : 'guest';
            const queryKey = query && Object.keys(query).length > 0 ? JSON.stringify(query) : null;

            const parts = [`${cachePrefix}${userKey}`];

            if (restaurantId && typeof restaurantId !== 'string') {
                parts.push(String(restaurantId));
            } else if (restaurantId) {
                parts.push(`restaurantId:${restaurantId}`);
            }

            if (queryKey) {
                parts.push(queryKey);
            }

            const cacheKey = parts.join(':');
            // Check for cached data
            let cachedData = await redis.get(cacheKey);
            cachedData = JSON.parse(cachedData);
            if (cachedData) {
                return res.status(200).send({
                    status: 'success',
                    message: '',
                    total: cachedData?.count,
                    data: cachedData.rows ?? cachedData
                });
            }

            // Attach cache and clearCache methods to response
            res.cache = async (data) => {
                    if (!data) return;
                    if (Array.isArray(data) && data.length === 0) return;
                    if (typeof data === 'object' && Object.keys(data.toJSON ? data.toJSON() : data).length === 0) return;
                await redis.setex(cacheKey, cacheDuration || 1800, JSON.stringify(data)); // Store the data in cache
            };

            next();
        } catch (error) {
            console.error('Redis Middleware Error:', error.message);
            next();
        }
    };
};

export const clearCache = (cachePrefix) => {
    return async (req, res, next) => {
        try {
            if (!redis) {
                console.warn('Redis client not initialized');
                return next();
            }

            // Construct the key pattern (e.g., "will-searchuser:*")
            const keyPattern = `${cachePrefix}*`;

            // Get all keys matching the pattern
            const keys = await redis.keys(keyPattern);

            if (keys.length > 0) {
                // Delete all matching keys
                await redis.del(...keys);
                console.log(`Cleared ${keys.length} cache keys matching pattern: ${keyPattern}`);
            }
            next();
        } catch (error) {
            console.error('❌ Redis Cache Clearing Error:', error.message);
            next();
        }
    };
};


// Clear cache funtion 
export const clearCacheData = async (cachePrefix, options = {}) => {
    if (!redis) {
      console.warn('Redis client not initialized');
      return;
    }
  
    try {
      const { user, query = {}, restaurantId = null } = options;
  
      const userKey = user ? `user:${user.type}:${user.id}` : 'guest';
      const queryKey = query && Object.keys(query).length > 0 ? JSON.stringify(query) : null;
  
      const parts = [`${cachePrefix}${userKey}`];
  
      if (restaurantId) {
        parts.push(`restaurantId:${restaurantId}`);
      }
  
      if (queryKey) {
        parts.push(queryKey);
      }
  
      const cacheKey = parts.join(':');
  
      const deletedCount = await redis.del(cacheKey);
  
      if (deletedCount > 0) {
        console.log(`✅ Cleared cache key: ${cacheKey}`);
      } else {
        console.log(`ℹ No cache found for key: ${cacheKey}`);
      }
  
    } catch (error) {
      console.error('❌ Redis Cache Clearing Error:', error.message);
    }
  };
  

// get cart cache funtion 
export const getCache = async (cachePrefix, options = {}) => {
  try {
      const { user, query = {}, restaurantId = null } = options;
    
      if (!redis) {
          console.warn('Redis client not initialized');
          return null;
      }

      const userKey = user ? `user:${user.type}:${user.id}` : 'guest';
      const queryKey = query && Object.keys(query).length > 0 ? JSON.stringify(query) : null;

      const parts = [`${cachePrefix}${userKey}`];

      if (restaurantId) {
          parts.push(`restaurantId:${restaurantId}`);
      }

      if (queryKey) {
          parts.push(queryKey);
      }

      const cacheKey = parts.join(':');
      let cachedData = await redis.get(cacheKey);
      cachedData = JSON.parse(cachedData);
  
      return cachedData; // return null if not found

  } catch (error) {
      console.error('Redis Utility Error:', error.message);
      return null;
  }
};
