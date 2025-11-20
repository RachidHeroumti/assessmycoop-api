import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Create mocks
const mockUser = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
};

const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const mockJwt = {
  sign: jest.fn(),
};

// Mock modules
jest.unstable_mockModule("../user.model.js", () => ({
  default: mockUser,
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: mockBcrypt,
  hash: mockBcrypt.hash,
  compare: mockBcrypt.compare,
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: mockJwt,
  sign: mockJwt.sign,
}));

// Import controller after mocking
const { register, login, getAllUsers, getUserById, updateUser, deleteUser } =
  await import("../user.controller.js");

describe("User Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
        role: "user",
      };

      req.body = userData;

      mockUser.findOne.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedPassword123");
      mockUser.create.mockResolvedValue({
        id: 1,
        ...userData,
        password: "hashedPassword123",
      });

      await register(req, res);

      expect(mockUser.findOne).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User registered successfully",
          user: expect.objectContaining({
            id: 1,
            email: userData.email,
          }),
        })
      );
    });

    it("should return 400 if user already exists", async () => {
      req.body = {
        email: "existing@example.com",
        password: "password123",
      };

      mockUser.findOne.mockResolvedValue({
        id: 1,
        email: "existing@example.com",
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User already exists" });
    });

    it("should handle errors during registration", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      mockUser.findOne.mockRejectedValue(new Error("Database error"));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Error registering user",
        })
      );
    });
  });

  describe("login", () => {
    it("should login user successfully", async () => {
      const userData = {
        id: 1,
        email: "john@example.com",
        password: "hashedPassword123",
        firstName: "John",
        lastName: "Doe",
        role: "user",
      };

      req.body = {
        email: "john@example.com",
        password: "password123",
      };

      mockUser.findOne.mockResolvedValue(userData);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue("mockToken123");

      await login(req, res);

      expect(mockUser.findOne).toHaveBeenCalledWith({
        where: { email: req.body.email },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        req.body.password,
        userData.password
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login successful",
          token: "mockToken123",
        })
      );
    });

    it("should return 401 if user not found", async () => {
      req.body = {
        email: "notfound@example.com",
        password: "password123",
      };

      mockUser.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("should return 401 if password is invalid", async () => {
      req.body = {
        email: "john@example.com",
        password: "wrongpassword",
      };

      mockUser.findOne.mockResolvedValue({
        id: 1,
        email: "john@example.com",
        password: "hashedPassword123",
      });
      mockBcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });
  });

  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const users = [
        {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          role: "user",
        },
        {
          id: 2,
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          role: "admin",
        },
      ];

      mockUser.findAll.mockResolvedValue(users);

      await getAllUsers(req, res);

      expect(mockUser.findAll).toHaveBeenCalledWith({
        attributes: { exclude: ["password"] },
      });
      expect(res.json).toHaveBeenCalledWith(users);
    });
  });

  describe("getUserById", () => {
    it("should return user by ID", async () => {
      const user = {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "user",
      };

      req.params.id = "1";
      mockUser.findByPk.mockResolvedValue(user);

      await getUserById(req, res);

      expect(mockUser.findByPk).toHaveBeenCalledWith("1", {
        attributes: { exclude: ["password"] },
      });
      expect(res.json).toHaveBeenCalledWith(user);
    });

    it("should return 404 if user not found", async () => {
      req.params.id = "999";
      mockUser.findByPk.mockResolvedValue(null);

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const existingUser = {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "user",
        update: jest.fn().mockResolvedValue(true),
      };

      req.params.id = "1";
      req.body = {
        firstName: "John Updated",
        lastName: "Doe Updated",
        email: "johnupdated@example.com",
        role: "admin",
      };

      mockUser.findByPk.mockResolvedValue(existingUser);

      await updateUser(req, res);

      expect(mockUser.findByPk).toHaveBeenCalledWith("1");
      expect(existingUser.update).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User updated successfully",
        })
      );
    });

    it("should return 404 if user not found", async () => {
      req.params.id = "999";
      mockUser.findByPk.mockResolvedValue(null);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      const existingUser = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true),
      };

      req.params.id = "1";
      mockUser.findByPk.mockResolvedValue(existingUser);

      await deleteUser(req, res);

      expect(mockUser.findByPk).toHaveBeenCalledWith("1");
      expect(existingUser.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "User deleted successfully",
      });
    });

    it("should return 404 if user not found", async () => {
      req.params.id = "999";
      mockUser.findByPk.mockResolvedValue(null);

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });
  });
});
