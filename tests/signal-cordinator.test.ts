import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract environment
const mockContract = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  signalTiming: new Map(),
  blockHeight: 100,
  
  // Contract functions
  updateSignalTiming(sender, intersectionId, greenDurationNS, greenDurationEW, yellowDuration) {
    if (sender !== this.admin) {
      return { error: 100 };
    }
    
    const cycleLength = greenDurationNS + greenDurationEW + (yellowDuration * 2);
    
    this.signalTiming.set(intersectionId, {
      greenDurationNS,
      greenDurationEW,
      yellowDuration,
      cycleLength,
      lastUpdated: this.blockHeight
    });
    
    return { success: true };
  },
  
  getSignalTiming(intersectionId) {
    return this.signalTiming.get(intersectionId) || null;
  },
  
  optimizeSignalTiming(sender, intersectionId, congestionLevelNS, congestionLevelEW) {
    if (sender !== this.admin) {
      return { error: 100 };
    }
    
    const timing = this.signalTiming.get(intersectionId);
    if (!timing) {
      return { error: 101 };
    }
    
    const newGreenNS = congestionLevelNS > congestionLevelEW
        ? timing.greenDurationNS + 5
        : timing.greenDurationNS;
    
    const newGreenEW = congestionLevelEW > congestionLevelNS
        ? timing.greenDurationEW + 5
        : timing.greenDurationEW;
    
    const newCycleLength = newGreenNS + newGreenEW + (timing.yellowDuration * 2);
    
    this.signalTiming.set(intersectionId, {
      greenDurationNS: newGreenNS,
      greenDurationEW: newGreenEW,
      yellowDuration: timing.yellowDuration,
      cycleLength: newCycleLength,
      lastUpdated: this.blockHeight
    });
    
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

describe('Signal Coordination Contract', () => {
  beforeEach(() => {
    // Reset the contract state before each test
    mockContract.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockContract.signalTiming = new Map();
    mockContract.blockHeight = 100;
  });
  
  it('should update signal timing', () => {
    const result = mockContract.updateSignalTiming(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'INT001',
        30,
        30,
        5
    );
    
    expect(result.success).toBe(true);
    
    const timing = mockContract.getSignalTiming('INT001');
    expect(timing).toEqual({
      greenDurationNS: 30,
      greenDurationEW: 30,
      yellowDuration: 5,
      cycleLength: 70, // 30 + 30 + (5 * 2)
      lastUpdated: 100
    });
  });
  
  it('should optimize signal timing based on congestion', () => {
    // First set initial timing
    mockContract.updateSignalTiming(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'INT001',
        30,
        30,
        5
    );
    
    // Then optimize with higher NS congestion
    const result = mockContract.optimizeSignalTiming(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'INT001',
        80, // NS congestion
        40  // EW congestion
    );
    
    expect(result.success).toBe(true);
    
    const timing = mockContract.getSignalTiming('INT001');
    expect(timing.greenDurationNS).toBe(35); // Should increase by 5
    expect(timing.greenDurationEW).toBe(30); // Should stay the same
  });
  
  it('should fail to optimize if intersection not found', () => {
    const result = mockContract.optimizeSignalTiming(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'INT002', // Non-existent intersection
        80,
        40
    );
    
    expect(result.error).toBe(101);
  });
});
