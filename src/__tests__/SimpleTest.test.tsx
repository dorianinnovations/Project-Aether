/**
 * Simple test to verify Jest setup is working
 */

describe('Basic Jest Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle basic string operations', () => {
    const greeting = 'Hello Aether!';
    expect(greeting).toContain('Aether');
    expect(greeting).toHaveLength(13);
  });

  it('should handle arrays', () => {
    const userJourney = ['app_start', 'signup', 'chat', 'insights'];
    expect(userJourney).toHaveLength(4);
    expect(userJourney[0]).toBe('app_start');
    expect(userJourney).toContain('chat');
  });

  it('should handle async operations', async () => {
    const mockApiCall = () => Promise.resolve({ success: true, data: 'test' });
    
    const result = await mockApiCall();
    expect(result.success).toBe(true);
    expect(result.data).toBe('test');
  });

  it('should handle mock functions', () => {
    const mockFunction = jest.fn();
    mockFunction('test-parameter');
    
    expect(mockFunction).toHaveBeenCalled();
    expect(mockFunction).toHaveBeenCalledWith('test-parameter');
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });
});