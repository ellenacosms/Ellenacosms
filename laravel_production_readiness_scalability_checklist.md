# Production Readiness, Scalability & Resilience Checklist for Laravel Applications

This document provides a practical pre-launch checklist for testing a
Laravel application before production, including functional quality,
security, deployment readiness, scalability, high-traffic performance,
resilience, and recovery.

## 1. Functional Testing

Test every important user workflow from beginning to end.

-   Registration
-   Login and logout
-   Password reset
-   Email verification
-   Google/OAuth authentication
-   Profile updates
-   CRUD operations
-   Search, filtering, sorting, and pagination
-   File uploads and downloads
-   Emails and notifications
-   Reports and exports
-   Role-based dashboards
-   Payments, where applicable
-   All important buttons, links, forms, and navigation
-   Invalid, incomplete, duplicate, and unexpected input

## 2. Authentication and Authorization Testing

Verify that authentication and access control cannot be bypassed.

-   Logged-out users cannot access protected pages.
-   Normal users cannot access administrator routes.
-   Users cannot access another user's private records by modifying URLs
    or IDs.
-   Role and permission middleware works correctly.
-   Sessions expire correctly.
-   Logout properly invalidates the session.
-   Password policies are enforced.
-   Password reset links work and expire.
-   Google OAuth callbacks work correctly.
-   Direct URL manipulation does not bypass permissions.

## 3. Security Testing

Test the application against common web security problems.

-   CSRF protection
-   SQL injection attempts
-   Cross-site scripting (XSS)
-   Insecure direct object references (IDOR)
-   Brute-force/login abuse
-   Rate limiting
-   File upload restrictions
-   MIME/file-extension validation
-   Oversized upload rejection
-   Exposed `.env` files
-   Directory listing
-   Sensitive API responses
-   Secure cookies
-   HTTPS enforcement
-   Security headers where appropriate
-   Secrets/API keys are not committed to GitHub

Production should use:

``` env
APP_ENV=production
APP_DEBUG=false
```

Never expose detailed Laravel exception pages to production users.

## 4. Database and Data-Integrity Testing

Test how the database behaves during both normal and abnormal
operations.

-   Unique constraints
-   Foreign keys
-   Duplicate submissions
-   Updates
-   Deletes
-   Transactions
-   Rollbacks
-   Failed operations
-   Production migrations
-   Seeders, if used
-   Large datasets
-   Database backups
-   Database restoration

A backup is not fully proven until you have successfully restored it.

## 5. Validation and Error Handling

Test forms and APIs with unexpected data.

Examples:

-   Invalid emails
-   Extremely long strings
-   Negative values
-   Invalid dates
-   Missing required fields
-   Invalid IDs
-   Wrong file formats
-   Oversized files
-   Duplicate requests

Users should receive understandable messages rather than Laravel stack
traces, SQL errors, or internal implementation details.

Also verify custom handling for:

-   404 Not Found
-   403 Forbidden
-   419 Session/CSRF expiration
-   422 Validation errors
-   429 Too Many Requests
-   500 Internal Server Error
-   503 Service Unavailable

## 6. Payment Testing

If the application processes money, test more than successful payments.

Test:

-   Successful transactions
-   Failed transactions
-   Cancelled transactions
-   Pending transactions
-   Duplicate callbacks
-   Duplicate payment attempts
-   Webhook/IPN processing
-   Invalid webhook signatures
-   Delayed webhooks
-   Replayed webhooks
-   Network interruption
-   Refreshing payment callback pages
-   Reconciliation between your database and payment provider

Payment processing should be idempotent where necessary so the same
event cannot accidentally create multiple payments.

Never trust payment amounts or transaction status supplied only by the
browser.

## 7. Third-Party Integration Testing

Test production/staging configurations for:

-   Google OAuth
-   SMTP/email
-   SMS
-   WhatsApp
-   Payment gateways
-   External APIs
-   Cloud storage
-   Webhooks
-   Maps
-   Analytics

Something working on localhost does not guarantee it will work with the
production domain, HTTPS, proxies, firewalls, or production credentials.

## 8. Responsive and Browser Testing

Test the application on:

-   Chrome
-   Edge
-   Firefox
-   Safari where applicable
-   Android browsers
-   iPhone/iOS browsers

Check desktop, tablet, and mobile layouts.

Pay special attention to:

-   Navigation
-   Forms
-   Tables
-   Modals
-   Dashboards
-   Reports
-   Payment pages
-   File uploads
-   Long text
-   Error messages

## 9. Production Environment & Deployment Testing

Verify:

-   Domain and DNS
-   HTTPS/SSL
-   HTTP → HTTPS redirect
-   `www`/non-`www` behavior
-   Storage links
-   File permissions
-   Environment variables
-   Database credentials
-   SMTP credentials
-   API credentials
-   Queues
-   Cron jobs
-   Laravel scheduler
-   Cache
-   Timezone
-   Production logging

Typical Laravel optimization commands:

``` bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Only cache configuration after confirming production environment values
are correct.

## 10. Logging and Monitoring

Verify that controlled errors are captured correctly.

Monitor:

-   HTTP error rate
-   Response times
-   CPU
-   Memory
-   Disk usage
-   Database utilization
-   Database connections
-   Queue depth
-   Failed jobs
-   Cache/Redis health
-   External API failures

Logs should never expose:

-   Passwords
-   Access tokens
-   API secrets
-   Card details
-   Private authentication credentials

The production team should be able to detect a failure before relying on
a customer to report it.

------------------------------------------------------------------------

# Scalability and High-Traffic Testing

A production application should not only work correctly; it should
continue operating as traffic increases.

## 11. Load Testing

Simulate realistic concurrent traffic against important endpoints.

Useful tools include:

-   k6
-   Apache JMeter
-   Locust
-   Artillery

Test workloads such as:

-   Login
-   Registration
-   Dashboard
-   Search
-   API requests
-   Product/listing pages
-   Checkout
-   Reports
-   Database-heavy operations

Measure:

-   Requests per second
-   Concurrent users
-   Average response time
-   p95/p99 latency
-   Error rate
-   CPU utilization
-   Memory usage
-   Database load

## 12. Stress Testing

Increase traffic beyond the expected production peak until performance
degrades or the system fails.

The objective is to discover:

-   Maximum sustainable load
-   Breaking point
-   First bottleneck
-   Failure behavior
-   Recovery behavior after traffic decreases

The application should preferably degrade gracefully rather than
completely collapse.

## 13. Spike Testing

Simulate sudden traffic increases.

Example:

``` text
100 concurrent users
        ↓
5,000 concurrent users within seconds
        ↓
Back to normal traffic
```

This helps determine how the infrastructure handles viral traffic,
promotions, major announcements, or sudden usage bursts.

## 14. Soak / Endurance Testing

Run realistic traffic continuously for several hours.

Look for:

-   Memory leaks
-   Increasing response times
-   Database connection exhaustion
-   Queue buildup
-   Disk growth
-   Worker instability
-   Cache problems
-   Resource exhaustion

An application that survives a 5-minute test may still fail after
several hours.

------------------------------------------------------------------------

# Scalable Laravel Architecture

A high-traffic Laravel deployment can evolve toward an architecture such
as:

``` text
                    Users
                      |
                      v
                CDN / Cloudflare
                      |
                      v
                 Load Balancer
                  /    |    \
                 v     v     v
              Laravel Laravel Laravel
              Server  Server  Server
                  \     |     /
                       Redis
                  /      |       \
             Sessions   Cache    Queues
                                 |
                                 v
                           Queue Workers
                                 |
                                 v
                              Database
                                 |
                      Backups / Replicas
```

The important principle is to remove unnecessary dependence on a single
application server.

## 15. Shared Sessions, Cache and Queues

When multiple Laravel application servers are running, local file-based
sessions and cache can create problems.

Redis is commonly used for shared infrastructure.

For example:

``` env
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

All application instances can then access common session, cache, and
queue infrastructure.

## 16. Queue Slow Operations

Do not make users wait for expensive background operations when they can
be processed asynchronously.

Good queue candidates include:

-   Emails
-   SMS
-   Notifications
-   Image processing
-   Report generation
-   Large exports
-   Webhook processing
-   Data imports
-   External API synchronization

Example:

``` php
SendInvoiceEmail::dispatch($invoice);
```

Queue workers should be monitored and automatically restarted when
necessary.

## 17. Database Scalability

The database frequently becomes a major bottleneck.

Review:

-   Indexes
-   Query execution plans
-   N+1 queries
-   Eager loading
-   Pagination
-   Connection limits
-   Slow-query logs
-   Caching
-   Transactions
-   Database server resources

Avoid loading enormous datasets into memory:

``` php
$users = User::all();
```

For user-facing lists, prefer approaches such as:

``` php
$users = User::paginate(50);
```

For batch/background processing, consider `chunk()`, `chunkById()`,
cursors, or other memory-efficient approaches where appropriate.

## 18. Caching

Cache frequently requested data that does not need to be recalculated on
every request.

Example:

``` php
Cache::remember('dashboard_stats', 60, function () {
    return /* expensive query/calculation */;
});
```

Possible caching targets include:

-   Dashboard statistics
-   Configuration
-   Categories
-   Public listings
-   Expensive aggregate queries
-   External API responses

Define an appropriate invalidation strategy so users do not receive
dangerously stale data.

## 19. CDN and Static Assets

Do not unnecessarily make Laravel serve every static resource.

Use a CDN/object-storage strategy where appropriate for:

-   Images
-   CSS
-   JavaScript
-   Videos
-   Large downloads
-   Public assets

This reduces bandwidth and request pressure on application servers.

## 20. Horizontal Scaling

Design the application so additional Laravel instances can be added
behind a load balancer.

``` text
                 Load Balancer
               /       |       \
              /        |        \
         Laravel 1  Laravel 2  Laravel 3
```

If one server becomes unhealthy, the load balancer should stop routing
new requests to it.

This requires application servers to be as stateless as practical, with
shared sessions/cache and persistent user files stored outside
individual instances.

------------------------------------------------------------------------

# Resilience and High Availability

## 21. Failover Testing

Do not only test the happy path.

During controlled testing:

1.  Generate realistic traffic.
2.  Stop one Laravel application server.
3.  Verify the load balancer detects the unhealthy instance.
4.  Confirm traffic continues through healthy instances.
5.  Restore the server.
6.  Confirm it safely rejoins service.

Also consider controlled failure tests for:

-   Queue workers
-   Redis
-   Database connectivity
-   External APIs
-   Object storage
-   DNS/CDN dependencies

## 22. Recovery Testing

Test what happens after a failure.

Verify:

-   Application services restart correctly.
-   Queue jobs are retried safely.
-   Failed jobs can be inspected.
-   Database can be restored.
-   Cache loss does not destroy critical data.
-   Deployments can be rolled back.
-   Production can recover from a bad release.

## 23. Define Performance Targets

Do not use "it feels fast" as the production requirement.

Define measurable targets before load testing.

Example:

``` text
Normal traffic:             300 concurrent users
Expected peak:            1,500 concurrent users
Stress-test target:       3,000 concurrent users
Target response time:     < 500 ms for key requests
Target error rate:        < 1%
Availability objective:   99.9%
```

Targets should be chosen based on the application's actual business
requirements and infrastructure.

## 24. Recommended Final Resilience Test

A useful pre-production exercise is:

1.  Determine expected peak traffic.
2.  Generate approximately 2× expected peak traffic in a safe staging
    environment.
3.  Keep the load running for 30--60 minutes.
4.  Observe application, database, Redis, queue, CPU, memory and latency
    metrics.
5.  Stop one application server.
6.  Confirm traffic is automatically routed elsewhere.
7.  Restart the failed server.
8.  Confirm recovery.
9.  Check for lost requests, duplicate transactions, failed jobs, or
    corrupted data.
10. Document the bottlenecks and repeat after improvements.

Do not perform aggressive stress testing against a live production
system unless the infrastructure and organization have explicitly
planned for it.

------------------------------------------------------------------------

# User Acceptance Testing (UAT)

Give the system to users who did not build it.

Ask them to perform realistic tasks without developer guidance.

Observe:

-   Confusing navigation
-   Missing information
-   Unexpected workflows
-   Difficult forms
-   Misleading error messages
-   Mobile usability
-   Accessibility problems

Developers know how the application is supposed to work. New users
reveal whether the application actually communicates that design
successfully.

------------------------------------------------------------------------

# Recommended Release Gates

A professional release process can use these gates:

``` text
Development
     ↓
Automated Tests / QA
     ↓
Security Testing
     ↓
Performance & Scalability Testing
     ↓
Staging
     ↓
UAT
     ↓
Production Deployment
     ↓
Production Smoke Tests
     ↓
Monitoring
```

Production should not be the first environment where the complete
application is tested.

------------------------------------------------------------------------

# Final Go-Live Checklist

## Application

-   [ ] Core workflows pass
-   [ ] Registration works
-   [ ] Login/logout works
-   [ ] Password reset works
-   [ ] Google OAuth works
-   [ ] Roles and permissions verified
-   [ ] Form validation verified
-   [ ] File uploads verified
-   [ ] Search/filter/pagination verified
-   [ ] Reports and exports verified
-   [ ] Error pages verified

## Security

-   [ ] CSRF protection verified
-   [ ] XSS testing completed
-   [ ] SQL injection defenses verified
-   [ ] IDOR/access-control testing completed
-   [ ] Rate limiting configured
-   [ ] Upload restrictions configured
-   [ ] `APP_DEBUG=false`
-   [ ] Secrets are not in Git
-   [ ] HTTPS enabled
-   [ ] Secure production cookies configured

## Database

-   [ ] Production migrations tested
-   [ ] Important indexes reviewed
-   [ ] N+1 queries reviewed
-   [ ] Large datasets tested
-   [ ] Database backup works
-   [ ] Backup restoration tested

## Integrations

-   [ ] Email/SMTP tested
-   [ ] Google OAuth tested
-   [ ] SMS/WhatsApp tested where applicable
-   [ ] Payment gateway tested
-   [ ] Webhooks/IPNs tested
-   [ ] External APIs tested

## Infrastructure

-   [ ] DNS correct
-   [ ] SSL certificate working
-   [ ] HTTP → HTTPS redirect working
-   [ ] Storage configured
-   [ ] Permissions correct
-   [ ] Queues operational
-   [ ] Scheduler/cron operational
-   [ ] Redis operational where used
-   [ ] Process/worker restart strategy configured
-   [ ] Logs operational
-   [ ] Monitoring and alerts operational

## Performance & Scalability

-   [ ] Load test completed
-   [ ] Stress test completed
-   [ ] Spike test completed
-   [ ] Soak test completed
-   [ ] Expected peak traffic handled
-   [ ] Response-time target achieved
-   [ ] Error-rate target achieved
-   [ ] Database remains healthy under load
-   [ ] Queue remains healthy under load
-   [ ] Cache behavior verified
-   [ ] Static assets/CDN optimized
-   [ ] Horizontal scaling strategy validated where required

## Resilience

-   [ ] Application-server failure tested
-   [ ] Queue-worker failure tested
-   [ ] External API failure handled
-   [ ] Retry/idempotency behavior verified
-   [ ] Database recovery procedure documented
-   [ ] Backup restoration verified
-   [ ] Deployment rollback tested/documented
-   [ ] System recovers after traffic spike
-   [ ] No duplicate financial transactions during retries/failures

## Release

-   [ ] Final UAT completed
-   [ ] Production configuration reviewed
-   [ ] Rollback plan available
-   [ ] Production deployment completed
-   [ ] Production smoke test passed
-   [ ] Monitoring checked immediately after deployment

------------------------------------------------------------------------

# Key Principle

A production-ready application should satisfy four requirements:

**Correctness:** It performs the intended business workflows correctly.

**Security:** Users and data are protected against unauthorized access
and common attacks.

**Scalability:** Increasing traffic can be handled without unacceptable
degradation.

**Resilience:** Individual failures do not unnecessarily bring down the
entire service, and the system can recover safely.

The final objective is therefore not merely **"Does the application
work?"** but:

> **Does it remain correct, secure, responsive, recoverable, and
> operational under realistic production conditions?**
