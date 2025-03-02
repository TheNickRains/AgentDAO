import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceMetrics {
  service: string;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface ErrorLog {
  service: string;
  error: string;
  stack?: string;
  metadata?: any;
  timestamp: Date;
}

export class MonitoringService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async logMetrics(metrics: Omit<ServiceMetrics, 'timestamp'>) {
    try {
      const { error } = await this.supabase
        .from('service_metrics')
        .insert([{
          ...metrics,
          timestamp: new Date(),
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to log metrics:', error);
    }
  }

  async logError(error: Omit<ErrorLog, 'timestamp'>) {
    try {
      const { error: dbError } = await this.supabase
        .from('error_logs')
        .insert([{
          ...error,
          timestamp: new Date(),
        }]);

      if (dbError) throw dbError;
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  }

  // Performance monitoring wrapper
  async trackPerformance<T>(
    service: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      await this.logMetrics({
        service,
        operation,
        duration: Date.now() - startTime,
        success: true,
      });
      return result;
    } catch (error: any) {
      await this.logMetrics({
        service,
        operation,
        duration: Date.now() - startTime,
        success: false,
        error: error.message,
      });
      throw error;
    }
  }

  // Health check function
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, {
      status: 'up' | 'down';
      lastError?: string;
      avgResponseTime?: number;
    }>;
  }> {
    try {
      // Get recent metrics for all services
      const { data: metrics, error: metricsError } = await this.supabase
        .from('service_metrics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes
        .order('timestamp', { ascending: false });

      if (metricsError) throw metricsError;

      const services: Record<string, {
        status: 'up' | 'down';
        lastError?: string;
        avgResponseTime?: number;
      }> = {};

      // Process metrics
      metrics?.forEach((metric: ServiceMetrics) => {
        if (!services[metric.service]) {
          services[metric.service] = {
            status: 'up',
            avgResponseTime: metric.duration,
          };
        }

        if (!metric.success) {
          services[metric.service].status = 'down';
          services[metric.service].lastError = metric.error;
        }
      });

      // Determine overall status
      const downServices = Object.values(services).filter(s => s.status === 'down').length;
      const status = downServices === 0 ? 'healthy' :
        downServices < Object.keys(services).length ? 'degraded' : 'unhealthy';

      return {
        status,
        services,
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        services: {},
      };
    }
  }
} 