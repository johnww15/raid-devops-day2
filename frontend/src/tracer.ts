import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

const otlpEndpoint =
  import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces' || 'http://localhost:4318/v1/traces';

const exporter = new OTLPTraceExporter({ url: otlpEndpoint });

const provider = new WebTracerProvider({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'raid-frontend',
  }),
  spanProcessors: [new BatchSpanProcessor(exporter)],
});

provider.register();

registerInstrumentations({
  instrumentations: [
    getWebAutoInstrumentations({
      '@opentelemetry/instrumentation-fetch': {
        // Propagate trace context headers to all origins so backend can link spans
        propagateTraceHeaderCorsUrls: [/.*/],
        clearTimingResources: true,
      },
      '@opentelemetry/instrumentation-xml-http-request': {
        propagateTraceHeaderCorsUrls: [/.*/],
      },
    }),
  ],
});

console.log(`OpenTelemetry SDK started. Traces will be sent to ${otlpEndpoint}`);

export default provider;
