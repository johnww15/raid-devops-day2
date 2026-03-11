import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// Default gRPC OTLP endpoint is usually localhost:4317
const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4317';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'raid-backend',
  }),

  // 1. Traces via gRPC
  traceExporter: new OTLPTraceExporter({
    url: otelEndpoint,
  }),

  // 2. Metrics via gRPC
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: otelEndpoint,
    }),
  }),

  // 3. Logs via gRPC
  logRecordProcessor: new BatchLogRecordProcessor(
    new OTLPLogExporter({
      url: otelEndpoint,
    })
  ),

  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

console.log(`OTEL SDK: Started using gRPC pointing to ${otelEndpoint}`);