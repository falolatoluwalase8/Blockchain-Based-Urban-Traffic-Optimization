import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract environment
const mockContract = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  trafficFlowData: new Map(),
  blockHeight: 100,
  
  // Contract functions
  recordTrafficFlow(sender, intersectionId, vehicleCount, averageSpeed, congestionLevel) {
    if (sender !== this.admin) {
      return { error: 100 };
    }
    
    const key = `${intersectionId}-${this.blockHeight}`;
    this.trafficFlowData.set(key, {
      vehicleCount,
      averageSpeed,
      congestionLevel
    });
    
    return { success: true };
  },
  
  getTrafficFlow(intersectionId, timestamp) {
    const key = `${intersectionId}-${timestamp}`;
    return this.trafficFlowData.get(key) || null;
  },
  
  getAverageCongestion(intersectionId) {
    const key = `${intersectionId}-${this.blockHeight}`;
    const data = this.trafficFlowData.get(key);
    
    if (!data) {
      return { error: 101 };
    }
    
    return { success: data.congestionLevel };
  },
  
  transferAdmin(sender, newAdmin) {
    if (sender !== this.admin) {
      return { error: 100 };
    }
    
    this.admin = newAdmin;
    return { success: true };
  }
};

describe('Vehicle Flow Contract', () => {
  beforeEach(() => {
    // Reset the contract state before each test
    mockContract.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockContract.trafficFlowData = new Map();
    mockContract.blockHeight = 100;
  });
  
  it('should record traffic flow data', () => {
    const result = mockContract.recordTrafficFlow(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'INT001',
        150,
        35,
        60
    );
    
    expect(result.success).toBe(true);
    
    const data = mockContract.getTrafficFlow('INT001', 100);
    expect(data).toEqual({
      vehicleCount: 150,
      averageSpeed: 35,
      congestionLevel: 60
    });
  });
  
  it('should fail to record if not admin', () => {
    const result = mockContract.recordTrafficFlow(
        'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Different address
        'INT001',
        150,
        35,
        60
    );
    
    expect(result.error).toBe(100);
    expect(mockContract.getTrafficFlow('INT001', 100)).toBe(null);
  });
  
  it('should get average congestion level', () => {
    // First record some data
    mockContract.recordTrafficFlow(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'INT001',
        150,
        35,
        60
    );
    
    const result = mockContract.getAverageCongestion('INT001');
    expect(result.success).toBe(60);
  });
  
  it('should return error when no data for average congestion', () => {
    const result = mockContract.getAverageCongestion('INT002');
    expect(result.error).toBe(101);
  });
});
