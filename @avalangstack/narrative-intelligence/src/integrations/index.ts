/**
 * Integration exports for narrative-intelligence
 */

export {
  // Interfaces
  RedisConfig,
  RedisClient,
  HealthCheckResult,
  // Factory functions
  createRedisConfig,
  // Classes
  NarrativeRedisManager,
  MockRedis,
  // Convenience functions
  getNarrativeManager,
} from "./redis_state.js";
