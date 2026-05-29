# Deployment

The build output (`dist/`) is plain static files. Host it however you like —
an object store, Cloudflare Pages, Netlify, `python -m http.server`, or the edge
you already run. Then open it and add a connection (instance URL + API token).

## Serving it as GoatCounter's dashboard (same origin)

If you want your GoatCounter domain (e.g. `stats.example.com`) to show this
dashboard **instead of** GoatCounter's built-in UI, put a small reverse proxy in
front. The proxy serves the static dashboard at `/` and forwards everything else
to GoatCounter — crucially the `/count` pageview beacon and the `/api/v0/*` the
dashboard reads, plus GoatCounter's own login/settings pages.

Same-origin also means no CORS and no preflights, so it's the snappiest setup.

### 1. Run GoatCounter on an internal port

```
goatcounter serve -listen 127.0.0.1:8081 -tls http ...
```

### 2. Drop the dashboard somewhere the proxy can read

```sh
curl -fsSL https://github.com/itsnex1s/goatcounter-dashboard/releases/latest/download/goatcounter-dashboard.tar.gz \
  | tar -xz -C /var/www/goatcounter-dashboard
```

(Or build it yourself with `pnpm build` and copy `dist/`.)

### 3. nginx in front

```nginx
server {
    listen 80;                       # or whatever your TLS terminator points at
    server_name stats.example.com;
    root /var/www/goatcounter-dashboard;

    # The dashboard (static), served only at these exact paths.
    location = /            { try_files /index.html =404; }
    location = /index.html  { }
    location = /favicon.svg { }
    location /assets/       { }
    location = /countries-110m.json { }

    # Everything else -> GoatCounter: the /count beacon, /api/v0/*, and
    # GoatCounter's own login/settings pages.
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

`nginx -t && systemctl reload nginx`, and `stats.example.com` now serves the
dashboard while collection and the API keep working.

> **Verify collection after cutover.** A request to `/count` must still reach
> GoatCounter (a paramless `GET /count` returns `400` *from GoatCounter* — not an
> nginx `404`). If you see a `404`, a `location` rule is shadowing the beacon.

## Notes

- The dashboard never needs build-time secrets. The API token is entered in the
  browser at runtime and kept in `localStorage`.
- Use a token with only the `stats` permission (read-only).
