import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'; // Added MeterProvider
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { logs } from '@opentelemetry/api-logs'; // Import the logs API
import { metrics } from '@opentelemetry/api';    // Import the metrics API

const otelBase = import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'raid-frontend',
});

// 1. Setup Tracing (Looks good!)
const provider = new WebTracerProvider({ resource });
provider.addSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter({ 
  url: `${otelBase}/v1/traces` 
})));
provider.register();

// 2. Setup Metrics (FIXED: Added MeterProvider and Registration)
const meterProvider = new MeterProvider({
  resource,
  readers: [
    new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: `${otelBase}/v1/metrics` }),
      exportIntervalMillis: 60000,
    }),
  ],
});
metrics.setGlobalMeterProvider(meterProvider);

// 3. Setup Logs (FIXED: Added Global Registration)
const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(
  new BatchLogRecordProcessor(new OTLPLogExporter({ url: `${otelBase}/v1/logs` }))
);
logs.setGlobalLoggerProvider(loggerProvider); // Register globally

// 4. Register Instrumentations
registerInstrumentations({
  instrumentations: [
    getWebAutoInstrumentations({
      '@opentelemetry/instrumentation-fetch': {
        propagateTraceHeaderCorsUrls: [/.*/],
      },
      // Note: Browser auto-instrumentation for logs is still experimental
      // You often need to manually bridge console.log if desired.
    }),
  ],
});

console.log(`Frontend OTEL: Fully registered via ${otelBase}`);

export default provider;