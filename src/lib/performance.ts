// Performance monitoring utility
export const performanceMonitor = {
  // Measure component render time
  measureRender: (componentName: string, callback: () => void) => {
    if (import.meta.env.DEV) {
      const start = performance.now();
      callback();
      const end = performance.now();
      console.log(`${componentName} rendered in ${(end - start).toFixed(2)}ms`);
    } else {
      callback();
    }
  },

  // Measure API call duration
  measureAPI: async (apiName: string, apiCall: () => Promise<any>) => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const end = performance.now();
      
      if (import.meta.env.DEV) {
        console.log(`API ${apiName} completed in ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      if (import.meta.env.DEV) {
        console.error(`API ${apiName} failed after ${(end - start).toFixed(2)}ms`);
      }
      throw error;
    }
  },

  // Log page load metrics
  logPageMetrics: () => {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (perfData && import.meta.env.DEV) {
          console.log('Page Load Metrics:', {
            'DNS Lookup': `${(perfData.domainLookupEnd - perfData.domainLookupStart).toFixed(2)}ms`,
            'TCP Connection': `${(perfData.connectEnd - perfData.connectStart).toFixed(2)}ms`,
            'Request Time': `${(perfData.responseStart - perfData.requestStart).toFixed(2)}ms`,
            'Response Time': `${(perfData.responseEnd - perfData.responseStart).toFixed(2)}ms`,
            'DOM Processing': `${(perfData.domComplete - perfData.domInteractive).toFixed(2)}ms`,
            'Total Load Time': `${(perfData.loadEventEnd - perfData.fetchStart).toFixed(2)}ms`,
          });
        }
      }, 0);
    });
  }
};

// Initialize page metrics logging
if (import.meta.env.DEV) {
  performanceMonitor.logPageMetrics();
}
