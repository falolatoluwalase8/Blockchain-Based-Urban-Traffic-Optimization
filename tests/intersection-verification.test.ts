import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract environment
const mockContract = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  verifiedIntersections: new Map(),
  blockHeight: 100,
  
  // Contract functions
  registerIntersection(sender, intersectionId, latitude, longitude) {
    if (sender !== this.admin) {
      return { error: 100 };
    }
    
    this.verifiedIntersections.set(intersectionId, {
      latitude,
      longitude,
      isActive: true,
      lastVerified: this.blockHeight
    });
    
    return { success: true };
  },
  
  isIntersectionVerified(intersectionId) {
    return this.verifiedIntersections.has(intersectionId);
  },
  
  updateIntersectionStatus(sender, intersectionId, isActive) {
    if (sender !== this.admin) {
      return { error: 100 };
    }
    
    if (!this.verifiedIntersections.has(intersectionId)) {
      return { error: 101 };
    }
    
    const intersection = this.verifiedIntersections.get(intersectionId);
    intersection.isActive = isActive;
    intersection.lastVerified = this.blockHeight;
    this.verifiedIntersections.set(intersectionId, intersection);
    
    return { success: true };
  },
  
  transferAdmin(sender, newAdmin) {
    if (sender !== this.admin) {
      return { error: 100 };
    }
    
    this.admin = newAdmin;
    return { success: true };
  }
};

describe('Intersection Verification Contract', () => {
  beforeEach(() => {
    // Reset the contract state before each test
    mockContract.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockContract.verifiedIntersections = new Map();
    mockContract.blockHeight = 100;
  });
  
  it('should register a new intersection', () => {
    const result = mockContract.registerIntersection(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'INT001',
        40123456,
        -74123456
    );
    
    expect(result.success).toBe(true);
    expect(mockContract.isIntersectionVerified('INT001')).toBe(true);
  });
  
  it('should fail to register if not admin', () => {
    const result = mockContract.registerIntersection(
        'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Different address
        'INT001',
        40123456,
        -74123456
    );
    
    expect(result.error).toBe(100);
    expect(mockContract.isIntersectionVerified('INT001')).toBe(false);
  });
  
  it('should update intersection status', () => {
    // First register an intersection
    mockContract.registerIntersection(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'INT001',
        40123456,
        -74123456
    );
    
    // Then update its status
    const result = mockContract.updateIntersectionStatus(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'INT001',
        false
    );
    
    expect(result.success).toBe(true);
    expect(mockContract.verifiedIntersections.get('INT001').isActive).toBe(false);
  });
  
  it('should transfer admin rights', () => {
    const newAdmin = 'ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    const result = mockContract.transferAdmin(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        newAdmin
    );
    
    expect(result.success).toBe(true);
    expect(mockContract.admin).toBe(newAdmin);
    
    // Verify old admin can no longer register intersections
    const registerResult = mockContract.registerIntersection(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'INT002',
        40123456,
        -74123456
    );
    
    expect(registerResult.error).toBe(100);
  });
});
