# Which addresses are open and which are not

The gate lives in one place, `lib/supabase/middleware.ts`, and matches
whole addresses rather than the start of a string. The rule is: a path
is in an area only if it is that address or something underneath it.

Open to everybody. None of these may ever be gated.

    /                    /discover            /how-it-works
    /membership          /villages            /villages/dubai
    /villages/suggest    /events              /businesses
    /learning            /media               /watch
    /members             /members/<id>        /contact
    /apply               /login               /legal/...
    /menu                /e/<event>           /reset-password

Members only. A visitor is sent to the sign in page.

    /home        /welcome      /village      /my-village
    /my-circle   /circles      /directory    /me
    /more        /for-you      /network      /messages
    /notifications             /market-exploration
    /suggestions /library      /photos       /search
    /upgrade     /settings     /report       /groups
    /pods        /jobs         /renew        /markets
    /live        /educator     /lead         /admin
    /global

The two that caught us: `/villages` begins with `/village`, and
`/membership` begins with `/members`. Under the old rule both were
treated as member pages and shut to the public.