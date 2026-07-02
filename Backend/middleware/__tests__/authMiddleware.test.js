import { jest } from '@jest/globals';

const mockVerify = jest.fn();
const mockUserFindById = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: mockVerify },
}));

jest.unstable_mockModule('../../models/User.js', () => ({
  default: {
    findById: mockUserFindById,
  },
}));

const { protect, educatorOnly, verifyOwnership } = await import('../authMiddleware.js');

function mockReqRes(next) {
  const req = { header: jest.fn(), params: {}, user: null };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res, next };
}

describe('authMiddleware', () => {
  let originalJwtSecret;

  beforeAll(() => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test_secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('protect', () => {
    test('should return 401 when no token provided', async () => {
      const { req, res, next } = mockReqRes(jest.fn());
      req.header.mockReturnValue(null);

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.',
        errorCode: 'AUTH_NO_TOKEN',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when token does not start with Bearer', async () => {
      const { req, res, next } = mockReqRes(jest.fn());
      req.header.mockReturnValue('Basic token');

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.',
        errorCode: 'AUTH_NO_TOKEN',
      });
    });

    test('should return 401 when user not found', async () => {
      const { req, res, next } = mockReqRes(jest.fn());
      req.header.mockReturnValue('Bearer validtoken');
      mockVerify.mockReturnValue({ id: 'user1' });
      mockUserFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        errorCode: 'AUTH_USER_NOT_FOUND',
      });
    });

    test('should return 401 when token is invalid', async () => {
      const { req, res, next } = mockReqRes(jest.fn());
      req.header.mockReturnValue('Bearer badtoken');
      mockVerify.mockImplementation(() => { throw new Error('Invalid token'); });
      Error.prototype.name = 'JsonWebTokenError';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
        errorCode: 'AUTH_INVALID_TOKEN',
      });
    });

    test('should return 401 when token is expired', async () => {
      const { req, res, next } = mockReqRes(jest.fn());
      req.header.mockReturnValue('Bearer expiredtoken');
      mockVerify.mockImplementation(() => { throw new Error('Token expired'); });
      Error.prototype.name = 'TokenExpiredError';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token has expired',
        errorCode: 'AUTH_TOKEN_EXPIRED',
      });
    });

    test('should set req.user and call next when valid', async () => {
      const { req, res, next } = mockReqRes(jest.fn());
      req.header.mockReturnValue('Bearer validtoken');
      mockVerify.mockReturnValue({ id: 'user1' });
      mockUserFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: 'user1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'student',
          avatar: null,
        }),
      });

      await protect(req, res, next);

      expect(req.user._id).toBe('user1');
      expect(req.user.role).toBe('student');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('educatorOnly', () => {
    test('should return 403 when no user', () => {
      const { req, res, next } = mockReqRes(jest.fn());

      educatorOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Educator role required.',
        errorCode: 'AUTH_EDUCATOR_ONLY',
      });
    });

    test('should return 403 when role is not educator', () => {
      const { req, res, next } = mockReqRes(jest.fn());
      req.user = { role: 'student' };

      educatorOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should call next when role is educator', () => {
      const { req, res, next } = mockReqRes(jest.fn());
      req.user = { role: 'educator' };

      educatorOnly(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('verifyOwnership', () => {
    const MockModel = (resolveValue) => ({
      findById: jest.fn().mockResolvedValue(resolveValue),
    });

    test('should return 404 when resource not found', async () => {
      const model = MockModel(null);
      const middleware = verifyOwnership(model);
      const { req, res, next } = mockReqRes(jest.fn());
      req.params.id = 'unknown';
      req.user = { _id: 'user1' };

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
        errorCode: 'RESOURCE_NOT_FOUND',
      });
    });

    test('should return 403 when not owner', async () => {
      const resource = { _id: 'r1', educator: 'otherUser' };
      const model = MockModel(resource);
      const middleware = verifyOwnership(model);
      const { req, res, next } = mockReqRes(jest.fn());
      req.params.id = 'r1';
      req.user = { _id: 'user1' };

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this resource',
        errorCode: 'AUTH_NOT_OWNER',
      });
    });

    test('should set req.resource and call next when owner', async () => {
      const resource = { _id: 'r1', educator: 'user1' };
      const model = MockModel(resource);
      const middleware = verifyOwnership(model);
      const { req, res, next } = mockReqRes(jest.fn());
      req.params.id = 'r1';
      req.user = { _id: 'user1' };

      await middleware(req, res, next);

      expect(req.resource).toBe(resource);
      expect(next).toHaveBeenCalled();
    });
  });
});
