import dotenv from 'dotenv';
import { getDb, closeDb } from '../client';
import {
  services,
  dependencies,
  simulations,
  simulationResults,
} from '../schema';
import { Criticality, ServiceStatus, ImpactType, SeverityClassification } from '@dbrs/shared';

dotenv.config();

const TEAMS = ['Platform', 'Payments', 'Identity', 'Data', 'Commerce', 'Infrastructure', 'Security'];
const OWNERS = [
  'alice.chen', 'bob.martinez', 'carol.williams', 'david.kim', 'eva.patel',
  'frank.johnson', 'grace.lee', 'henry.brown', 'iris.garcia', 'jack.wilson',
];

const SERVICE_DEFINITIONS = [
  { name: 'api-gateway', team: 'Platform', criticality: Criticality.CRITICAL },
  { name: 'auth-service', team: 'Identity', criticality: Criticality.CRITICAL },
  { name: 'user-service', team: 'Identity', criticality: Criticality.HIGH },
  { name: 'session-store', team: 'Identity', criticality: Criticality.HIGH },
  { name: 'oauth-provider', team: 'Identity', criticality: Criticality.HIGH },
  { name: 'payment-gateway', team: 'Payments', criticality: Criticality.CRITICAL },
  { name: 'payment-processor', team: 'Payments', criticality: Criticality.CRITICAL },
  { name: 'billing-service', team: 'Payments', criticality: Criticality.HIGH },
  { name: 'invoice-generator', team: 'Payments', criticality: Criticality.MEDIUM },
  { name: 'subscription-manager', team: 'Payments', criticality: Criticality.HIGH },
  { name: 'checkout-service', team: 'Commerce', criticality: Criticality.CRITICAL },
  { name: 'cart-service', team: 'Commerce', criticality: Criticality.HIGH },
  { name: 'catalog-service', team: 'Commerce', criticality: Criticality.HIGH },
  { name: 'inventory-service', team: 'Commerce', criticality: Criticality.HIGH },
  { name: 'pricing-engine', team: 'Commerce', criticality: Criticality.MEDIUM },
  { name: 'order-service', team: 'Commerce', criticality: Criticality.CRITICAL },
  { name: 'fulfillment-service', team: 'Commerce', criticality: Criticality.HIGH },
  { name: 'shipping-service', team: 'Commerce', criticality: Criticality.MEDIUM },
  { name: 'notification-service', team: 'Platform', criticality: Criticality.MEDIUM },
  { name: 'email-service', team: 'Platform', criticality: Criticality.MEDIUM },
  { name: 'sms-service', team: 'Platform', criticality: Criticality.LOW },
  { name: 'push-notification', team: 'Platform', criticality: Criticality.LOW },
  { name: 'analytics-collector', team: 'Data', criticality: Criticality.MEDIUM },
  { name: 'event-bus', team: 'Platform', criticality: Criticality.CRITICAL },
  { name: 'message-queue', team: 'Platform', criticality: Criticality.CRITICAL },
  { name: 'search-service', team: 'Data', criticality: Criticality.HIGH },
  { name: 'recommendation-engine', team: 'Data', criticality: Criticality.MEDIUM },
  { name: 'data-warehouse', team: 'Data', criticality: Criticality.HIGH },
  { name: 'etl-pipeline', team: 'Data', criticality: Criticality.MEDIUM },
  { name: 'reporting-service', team: 'Data', criticality: Criticality.LOW },
  { name: 'cdn-service', team: 'Infrastructure', criticality: Criticality.HIGH },
  { name: 'load-balancer', team: 'Infrastructure', criticality: Criticality.CRITICAL },
  { name: 'dns-service', team: 'Infrastructure', criticality: Criticality.CRITICAL },
  { name: 'monitoring-service', team: 'Infrastructure', criticality: Criticality.HIGH },
  { name: 'logging-service', team: 'Infrastructure', criticality: Criticality.MEDIUM },
  { name: 'metrics-collector', team: 'Infrastructure', criticality: Criticality.MEDIUM },
  { name: 'alert-manager', team: 'Infrastructure', criticality: Criticality.HIGH },
  { name: 'secrets-manager', team: 'Security', criticality: Criticality.CRITICAL },
  { name: 'certificate-service', team: 'Security', criticality: Criticality.HIGH },
  { name: 'waf-service', team: 'Security', criticality: Criticality.HIGH },
  { name: 'rate-limiter', team: 'Security', criticality: Criticality.MEDIUM },
  { name: 'audit-service', team: 'Security', criticality: Criticality.HIGH },
  { name: 'compliance-checker', team: 'Security', criticality: Criticality.MEDIUM },
  { name: 'feature-flags', team: 'Platform', criticality: Criticality.MEDIUM },
  { name: 'config-service', team: 'Platform', criticality: Criticality.HIGH },
  { name: 'cache-service', team: 'Platform', criticality: Criticality.HIGH },
  { name: 'redis-cluster', team: 'Infrastructure', criticality: Criticality.CRITICAL },
  { name: 'postgres-primary', team: 'Infrastructure', criticality: Criticality.CRITICAL },
  { name: 'postgres-replica', team: 'Infrastructure', criticality: Criticality.HIGH },
  { name: 'backup-service', team: 'Infrastructure', criticality: Criticality.MEDIUM },
];

const DEPENDENCY_PAIRS: [string, string][] = [
  ['api-gateway', 'auth-service'],
  ['api-gateway', 'rate-limiter'],
  ['api-gateway', 'load-balancer'],
  ['auth-service', 'user-service'],
  ['auth-service', 'session-store'],
  ['auth-service', 'oauth-provider'],
  ['auth-service', 'secrets-manager'],
  ['user-service', 'postgres-primary'],
  ['user-service', 'cache-service'],
  ['session-store', 'redis-cluster'],
  ['oauth-provider', 'secrets-manager'],
  ['checkout-service', 'cart-service'],
  ['checkout-service', 'payment-gateway'],
  ['checkout-service', 'inventory-service'],
  ['checkout-service', 'pricing-engine'],
  ['cart-service', 'catalog-service'],
  ['cart-service', 'cache-service'],
  ['catalog-service', 'search-service'],
  ['catalog-service', 'postgres-replica'],
  ['inventory-service', 'postgres-primary'],
  ['inventory-service', 'event-bus'],
  ['order-service', 'checkout-service'],
  ['order-service', 'fulfillment-service'],
  ['order-service', 'notification-service'],
  ['order-service', 'analytics-collector'],
  ['fulfillment-service', 'inventory-service'],
  ['fulfillment-service', 'shipping-service'],
  ['payment-gateway', 'payment-processor'],
  ['payment-gateway', 'secrets-manager'],
  ['payment-processor', 'billing-service'],
  ['payment-processor', 'postgres-primary'],
  ['billing-service', 'invoice-generator'],
  ['billing-service', 'subscription-manager'],
  ['subscription-manager', 'user-service'],
  ['notification-service', 'email-service'],
  ['notification-service', 'sms-service'],
  ['notification-service', 'push-notification'],
  ['notification-service', 'message-queue'],
  ['email-service', 'message-queue'],
  ['analytics-collector', 'event-bus'],
  ['analytics-collector', 'data-warehouse'],
  ['event-bus', 'message-queue'],
  ['search-service', 'postgres-replica'],
  ['search-service', 'cache-service'],
  ['recommendation-engine', 'analytics-collector'],
  ['recommendation-engine', 'search-service'],
  ['data-warehouse', 'etl-pipeline'],
  ['etl-pipeline', 'postgres-replica'],
  ['reporting-service', 'data-warehouse'],
  ['cdn-service', 'dns-service'],
  ['load-balancer', 'dns-service'],
  ['monitoring-service', 'metrics-collector'],
  ['monitoring-service', 'alert-manager'],
  ['monitoring-service', 'logging-service'],
  ['logging-service', 'postgres-replica'],
  ['metrics-collector', 'redis-cluster'],
  ['alert-manager', 'notification-service'],
  ['secrets-manager', 'postgres-primary'],
  ['certificate-service', 'secrets-manager'],
  ['waf-service', 'rate-limiter'],
  ['audit-service', 'logging-service'],
  ['audit-service', 'postgres-primary'],
  ['compliance-checker', 'audit-service'],
  ['feature-flags', 'config-service'],
  ['feature-flags', 'cache-service'],
  ['config-service', 'postgres-primary'],
  ['cache-service', 'redis-cluster'],
  ['backup-service', 'postgres-primary'],
  ['api-gateway', 'feature-flags'],
  ['checkout-service', 'feature-flags'],
  ['order-service', 'payment-processor'],
  ['cart-service', 'feature-flags'],
  ['payment-gateway', 'waf-service'],
  ['auth-service', 'certificate-service'],
  ['user-service', 'audit-service'],
  ['checkout-service', 'rate-limiter'],
  ['catalog-service', 'recommendation-engine'],
  ['fulfillment-service', 'event-bus'],
  ['shipping-service', 'notification-service'],
  ['invoice-generator', 'email-service'],
  ['subscription-manager', 'billing-service'],
  ['pricing-engine', 'feature-flags'],
  ['search-service', 'cdn-service'],
  ['analytics-collector', 'reporting-service'],
  ['monitoring-service', 'api-gateway'],
  ['compliance-checker', 'billing-service'],
  ['oauth-provider', 'certificate-service'],
  ['push-notification', 'cache-service'],
  ['sms-service', 'secrets-manager'],
  ['etl-pipeline', 'event-bus'],
  ['data-warehouse', 'backup-service'],
  ['recommendation-engine', 'cache-service'],
  ['alert-manager', 'monitoring-service'],
  ['dns-service', 'certificate-service'],
  ['postgres-replica', 'postgres-primary'],
  ['redis-cluster', 'monitoring-service'],
  ['message-queue', 'monitoring-service'],
  ['waf-service', 'cdn-service'],
  ['rate-limiter', 'redis-cluster'],
  ['api-gateway', 'monitoring-service'],
  ['checkout-service', 'auth-service'],
  ['order-service', 'user-service'],
  ['payment-processor', 'compliance-checker'],
  ['billing-service', 'audit-service'],
  ['fulfillment-service', 'shipping-service'],
  ['inventory-service', 'cache-service'],
  ['catalog-service', 'cdn-service'],
  ['auth-service', 'rate-limiter'],
  ['user-service', 'notification-service'],
  ['checkout-service', 'user-service'],
  ['payment-gateway', 'compliance-checker'],
  ['subscription-manager', 'payment-processor'],
  ['analytics-collector', 'feature-flags'],
  ['search-service', 'analytics-collector'],
  ['reporting-service', 'analytics-collector'],
  ['config-service', 'secrets-manager'],
  ['feature-flags', 'config-service'],
  ['load-balancer', 'waf-service'],
  ['cdn-service', 'load-balancer'],
  ['backup-service', 'postgres-replica'],
  ['etl-pipeline', 'data-warehouse'],
  ['recommendation-engine', 'catalog-service'],
  ['pricing-engine', 'catalog-service'],
  ['cart-service', 'pricing-engine'],
  ['order-service', 'inventory-service'],
  ['fulfillment-service', 'order-service'],
  ['shipping-service', 'fulfillment-service'],
  ['email-service', 'secrets-manager'],
  ['push-notification', 'message-queue'],
  ['sms-service', 'message-queue'],
  ['alert-manager', 'logging-service'],
  ['metrics-collector', 'logging-service'],
  ['audit-service', 'compliance-checker'],
  ['certificate-service', 'dns-service'],
  ['oauth-provider', 'user-service'],
  ['session-store', 'user-service'],
  ['api-gateway', 'config-service'],
  ['checkout-service', 'order-service'],
  ['payment-processor', 'subscription-manager'],
  ['billing-service', 'payment-gateway'],
  ['invoice-generator', 'billing-service'],
  ['notification-service', 'user-service'],
  ['event-bus', 'analytics-collector'],
  ['data-warehouse', 'etl-pipeline'],
  ['monitoring-service', 'metrics-collector'],
  ['secrets-manager', 'certificate-service'],
  ['waf-service', 'api-gateway'],
  ['rate-limiter', 'waf-service'],
  ['cache-service', 'redis-cluster'],
  ['postgres-primary', 'backup-service'],
  ['search-service', 'recommendation-engine'],
  ['catalog-service', 'inventory-service'],
  ['cart-service', 'inventory-service'],
  ['checkout-service', 'payment-processor'],
  ['order-service', 'billing-service'],
  ['fulfillment-service', 'notification-service'],
  ['shipping-service', 'order-service'],
  ['analytics-collector', 'data-warehouse'],
  ['reporting-service', 'etl-pipeline'],
  ['config-service', 'feature-flags'],
  ['load-balancer', 'cdn-service'],
  ['dns-service', 'load-balancer'],
  ['monitoring-service', 'alert-manager'],
  ['logging-service', 'metrics-collector'],
  ['audit-service', 'notification-service'],
  ['compliance-checker', 'payment-gateway'],
  ['oauth-provider', 'session-store'],
  ['user-service', 'oauth-provider'],
  ['auth-service', 'cache-service'],
  ['api-gateway', 'waf-service'],
  ['checkout-service', 'catalog-service'],
  ['payment-gateway', 'billing-service'],
  ['subscription-manager', 'invoice-generator'],
  ['recommendation-engine', 'user-service'],
  ['etl-pipeline', 'postgres-primary'],
  ['backup-service', 'secrets-manager'],
  ['alert-manager', 'email-service'],
  ['push-notification', 'user-service'],
  ['sms-service', 'notification-service'],
  ['pricing-engine', 'inventory-service'],
  ['feature-flags', 'api-gateway'],
  ['rate-limiter', 'auth-service'],
  ['waf-service', 'secrets-manager'],
  ['certificate-service', 'waf-service'],
  ['redis-cluster', 'secrets-manager'],
  ['postgres-replica', 'backup-service'],
  ['message-queue', 'event-bus'],
  ['event-bus', 'notification-service'],
  ['data-warehouse', 'reporting-service'],
  ['search-service', 'feature-flags'],
  ['catalog-service', 'analytics-collector'],
  ['inventory-service', 'postgres-replica'],
  ['order-service', 'event-bus'],
  ['fulfillment-service', 'postgres-primary'],
  ['shipping-service', 'postgres-replica'],
  ['billing-service', 'postgres-replica'],
  ['payment-processor', 'cache-service'],
  ['invoice-generator', 'postgres-replica'],
  ['subscription-manager', 'cache-service'],
  ['email-service', 'user-service'],
  ['analytics-collector', 'message-queue'],
  ['monitoring-service', 'postgres-primary'],
  ['logging-service', 'event-bus'],
  ['metrics-collector', 'monitoring-service'],
  ['audit-service', 'event-bus'],
  ['compliance-checker', 'order-service'],
  ['config-service', 'cache-service'],
  ['cdn-service', 'cache-service'],
  ['load-balancer', 'monitoring-service'],
  ['dns-service', 'monitoring-service'],
  ['backup-service', 'monitoring-service'],
  ['etl-pipeline', 'backup-service'],
  ['recommendation-engine', 'event-bus'],
  ['pricing-engine', 'analytics-collector'],
  ['cart-service', 'user-service'],
  ['checkout-service', 'recommendation-engine'],
  ['auth-service', 'audit-service'],
  ['user-service', 'feature-flags'],
  ['api-gateway', 'cdn-service'],
  ['payment-gateway', 'rate-limiter'],
  ['order-service', 'compliance-checker'],
  ['fulfillment-service', 'compliance-checker'],
  ['notification-service', 'event-bus'],
  ['search-service', 'event-bus'],
  ['reporting-service', 'notification-service'],
  ['alert-manager', 'sms-service'],
  ['secrets-manager', 'audit-service'],
  ['waf-service', 'monitoring-service'],
  ['rate-limiter', 'monitoring-service'],
  ['cache-service', 'monitoring-service'],
  ['postgres-primary', 'monitoring-service'],
  ['redis-cluster', 'postgres-primary'],
  ['message-queue', 'redis-cluster'],
  ['event-bus', 'redis-cluster'],
  ['data-warehouse', 'postgres-primary'],
  ['etl-pipeline', 'message-queue'],
  ['catalog-service', 'feature-flags'],
  ['inventory-service', 'monitoring-service'],
  ['shipping-service', 'monitoring-service'],
  ['billing-service', 'monitoring-service'],
  ['payment-processor', 'monitoring-service'],
  ['invoice-generator', 'monitoring-service'],
  ['subscription-manager', 'monitoring-service'],
  ['email-service', 'monitoring-service'],
  ['push-notification', 'monitoring-service'],
  ['sms-service', 'monitoring-service'],
  ['analytics-collector', 'monitoring-service'],
  ['recommendation-engine', 'monitoring-service'],
  ['compliance-checker', 'monitoring-service'],
  ['feature-flags', 'monitoring-service'],
  ['config-service', 'monitoring-service'],
  ['cdn-service', 'monitoring-service'],
  ['load-balancer', 'alert-manager'],
  ['dns-service', 'alert-manager'],
  ['backup-service', 'alert-manager'],
  ['oauth-provider', 'monitoring-service'],
  ['session-store', 'monitoring-service'],
  ['certificate-service', 'monitoring-service'],
  ['audit-service', 'monitoring-service'],
];

async function seed() {
  console.log('Clearing existing data...');
  const db = getDb();
  await db.delete(simulationResults);
  await db.delete(simulations);
  await db.delete(dependencies);
  await db.delete(services);

  console.log('Seeding services...');
  const serviceMap = new Map<string, string>();
  const statuses = [ServiceStatus.HEALTHY, ServiceStatus.HEALTHY, ServiceStatus.HEALTHY, ServiceStatus.DEGRADED, ServiceStatus.FAILED];

  for (let i = 0; i < SERVICE_DEFINITIONS.length; i++) {
    const def = SERVICE_DEFINITIONS[i];
    const [row] = await db
      .insert(services)
      .values({
        name: def.name,
        description: `${def.name} microservice for the ${def.team} team`,
        owner: OWNERS[i % OWNERS.length],
        team: def.team,
        criticality: def.criticality,
        status: statuses[i % statuses.length],
      })
      .returning();
    serviceMap.set(def.name, row.id);
  }

  console.log('Seeding dependencies...');

let depCount = 0;

const uniqueDependencies = new Set<string>();

for (const [source, target] of DEPENDENCY_PAIRS) {
  const sourceId = serviceMap.get(source);
  const targetId = serviceMap.get(target);

  if (!sourceId || !targetId) continue;

  const key = `${sourceId}-${targetId}`;

  if (uniqueDependencies.has(key)) continue;

  uniqueDependencies.add(key);

  await db.insert(dependencies).values({
    sourceServiceId: sourceId,
    targetServiceId: targetId,
  });

  depCount++;
}

console.log(`Created ${depCount} dependencies`);

  console.log('Seeding historical simulations...');
  const simConfigs = [
    { name: 'Auth Service Outage', failed: ['auth-service'], impacted: 12, severity: 68 },
    { name: 'Payment Gateway Failure', failed: ['payment-gateway'], impacted: 18, severity: 82 },
    { name: 'Database Primary Crash', failed: ['postgres-primary'], impacted: 35, severity: 95 },
    { name: 'Multi-Service Cascade', failed: ['api-gateway', 'event-bus'], impacted: 42, severity: 91 },
    { name: 'Cache Layer Degradation', failed: ['redis-cluster'], impacted: 22, severity: 74 },
    { name: 'CDN Outage Impact', failed: ['cdn-service'], impacted: 8, severity: 45 },
    { name: 'Identity Stack Failure', failed: ['auth-service', 'user-service'], impacted: 25, severity: 85 },
    { name: 'Checkout Pipeline Down', failed: ['checkout-service'], impacted: 15, severity: 78 },
  ];

  for (const config of simConfigs) {
    const failedIds = config.failed.map((n) => serviceMap.get(n)!).filter(Boolean);
    const [sim] = await db
      .insert(simulations)
      .values({
        name: config.name,
        failedServices: failedIds,
        totalImpacted: config.impacted,
        severityScore: config.severity,
        metadata: {
          severityClassification:
            config.severity >= 76
              ? SeverityClassification.CRITICAL
              : config.severity >= 51
                ? SeverityClassification.HIGH
                : config.severity >= 26
                  ? SeverityClassification.MEDIUM
                  : SeverityClassification.LOW,
          failedServiceNames: config.failed,
          breakdown: {
            affectedScore: config.impacted * 0.8,
            depthScore: 12,
            criticalityScore: 18,
            rootScore: config.failed.length * 2,
          },
        },
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      })
      .returning();

    for (const failedId of failedIds) {
      await db.insert(simulationResults).values({
        simulationId: sim.id,
        serviceId: failedId,
        impactType: ImpactType.ROOT,
        impactDepth: 0,
        dependencyPath: [failedId],
      });
    }
  }

  console.log('Seed completed successfully');
  console.log(`  Services: ${SERVICE_DEFINITIONS.length}`);
  console.log(`  Dependencies: ${depCount}`);
  console.log(`  Simulations: ${simConfigs.length}`);
  await closeDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
