import { UserService } from '../../../src/services/userService';
import { UserRepository } from '../../../src/database/repositories/UserRepository';

// Mock UserRepository
jest.mock('../../../src/database/repositories/UserRepository');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    userService = new UserService(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateUser', () => {
    it('should create a new user if not exists', async () => {
      const userData = {
        telegramId: 123456789,
        username: 'testuser',
        firstName: 'Test',
      };

      const createdUser = {
        id: 1,
        ...userData,
        subscriptionType: 'free' as const,
        monthlyResetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOrCreate.mockResolvedValue(createdUser);
      mockUserRepository.checkAndResetMonthlyLimits.mockResolvedValue();

      const result = await userService.getOrCreateUser(userData);

      expect(result).toEqual(createdUser);
      expect(mockUserRepository.findOrCreate).toHaveBeenCalledWith(userData);
      expect(mockUserRepository.checkAndResetMonthlyLimits).toHaveBeenCalledWith(1);
    });

    it('should return existing user if already exists', async () => {
      const userData = {
        telegramId: 123456789,
        username: 'testuser',
        firstName: 'Test',
      };

      const existingUser = {
        id: 1,
        ...userData,
        subscriptionType: 'pro' as const,
        subscriptionExpiry: new Date(),
        monthlyResetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOrCreate.mockResolvedValue(existingUser);
      mockUserRepository.checkAndResetMonthlyLimits.mockResolvedValue();

      const result = await userService.getOrCreateUser(userData);

      expect(result).toEqual(existingUser);
      expect(result.subscriptionType).toBe('pro');
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockUserRepository.countTotal.mockResolvedValue(100);
      mockUserRepository.countBySubscriptionType.mockResolvedValueOnce(80);
      mockUserRepository.countBySubscriptionType.mockResolvedValueOnce(20);
      mockUserRepository.countActive.mockResolvedValue(50);

      const stats = await userService.getUserStats();

      expect(stats).toEqual({
        totalUsers: 100,
        freeUsers: 80,
        proUsers: 20,
        activeUsers: 50,
      });
    });
  });
});

