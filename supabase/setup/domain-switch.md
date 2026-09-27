# Moving to the real domain

Nothing in the code has the address written into it. It reads one
setting, NEXT_PUBLIC_SITE_URL, from one file, lib/site.ts. Change that
setting and everything that leaves the site follows: the links in
emails, the re-enrolment links you paste into WhatsApp, the sharing
links, what Stripe sends people back to, the sitemap and what a link
looks like when somebody drops it into WhatsApp or LinkedIn.

## The order to do it in

1. Buy the domain.
2. Vercel, the project, Settings, Domains, add it. Vercel gives you the
   records to point at it. If you bought the domain at Vercel, it does
   this itself.
3. Wait for it to say valid, then open the site on the new address.
4. Vercel, Settings, Environment Variables, set:

       NEXT_PUBLIC_SITE_URL = https://yourdomain.com

   No trailing slash. It is trimmed either way, but keep it clean.
5. Redeploy. The setting is read at build time, so it does not change
   until you do.
6. Supabase, Authentication, URL Configuration. Set the site URL to the
   same address and add it to the redirect list. Sign in links go to
   whatever is set there, so if you miss this step every sign in link
   sends people to the vercel.app address.
7. Stripe, if it is connected by then: the checkout return addresses
   come from the same setting, so there is nothing to change in Stripe
   itself.
8. Resend: verify the domain, then set EMAIL_FROM to an address at it.
   See email-setup.md.

## What to check afterwards

- Sign out, request a sign in link, and look at where the link points.
  This is the one that catches step 6.
- Open the site's address with /sitemap.xml on the end. It should list
  the public pages, every Village and every public article.
- Paste the home page address into a WhatsApp message to yourself. It
  should show the name and the description rather than a bare link.
- Run the audit against the new address:

      node audit.mjs --base https://yourdomain.com

## The old address

Vercel keeps expatpreneur.vercel.app working and will redirect it to
the domain once the domain is the primary one. Nothing breaks for
anybody holding an old link.