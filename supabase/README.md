# Newsletter delivery

`20261028130000_bound_newsletter_dispatch_retries.sql` adds internal delivery
bookkeeping in `public.newsletter_dispatches`. It requires `pg_net` (already used
by the initial schema) and enables `pg_cron` for a reconciler every minute.

Configure `app.settings.webhook_secret` and `app.settings.site_url` at the database
level so both publishing sessions and the cron session see them. The site URL
must use HTTPS; the default remains `https://cernapensamento.org`.

A publication gets at most five automatic attempts, including the first send.
Attempts wait 1, 2, 4, and 8 minutes before retrying; the final result is checked
after 16 minutes. Each attempt stores the pg_net request ID. HTTP errors, timeouts,
and missing responses are reconciled after backoff. Requests still in pg_net's
queue are left alone until processed. Each run handles at most 100 publications.

The handler's existing claim and release behavior is preserved: retained
`newsletter_sent_at` claims prevent retries, including after partial email
success. Releasing a claim schedules a delayed retry. Edits and republishing
cannot reset an exhausted budget. Existing publications marked as sent are not
backfilled into this queue.

The service role can inspect dispatch state and run
`SELECT public.reconcile_newsletter_dispatches();`. Automatic retries stop at
`status = 'failed'`; investigate the provider/configuration before any deliberate
administrator reset. The queue and dispatch function are not writable/executable
by API clients. No provider error body or secret is copied into delivery state.

Run the transactional SQL regression suite after `npm run db:reset` with:

```sh
npx supabase test db
```

The tests use synthetic identities and uncommitted pg_net requests that are
rolled back, so they do not call external webhooks or send email.
