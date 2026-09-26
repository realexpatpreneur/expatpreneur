# What the live site is doing

https://expatpreneur.vercel.app, looked at on 2026-09-26 16:14.

Nothing here is from the code. Every line below is what the site
returned when asked.

## Is it all one build?

Yes. Every page served the same stylesheet, , so
what follows is one deployment rather than several.

## Pages that did not open

| Page | Address | Came back | Sent to |
| --- | --- | --- | --- |
| Membership | `/membership` | 307 | /login?recon=1716866226&next=%2Fmembership |
| Villages | `/villages` | 307 | /login?recon=773749788&next=%2Fvillages |
| A Village page | `/villages/dubai` | 307 | /login?recon=1783084463&next=%2Fvillages%2Fdubai |
| Suggest a city | `/villages/suggest` | 307 | /login?recon=1310671617&next=%2Fvillages%2Fsuggest |
| Events | `/events` | 307 | /login?recon=1833068600&next=%2Fevents |
| Businesses | `/businesses` | 307 | /login?recon=1674168930&next=%2Fbusinesses |
| Learning | `/learning` | 307 | /login?recon=1543238314&next=%2Flearning |
| Members | `/members` | 307 | /login?recon=530215437&next=%2Fmembers |
| The 404 | `/this-page-does-not-exist` | 404 |  |

A public page that sends a visitor to the sign in page is the worst
kind of fault here: the link is on the site, and it goes nowhere useful.

## Pages missing their approved wording

### Request an invitation
`/apply`. Not found on the page: First name; Last name.


## Pages missing the header or the footer

None. Every page kept both.

## Member pages open to a stranger

| Address | Came back |
| --- | --- |
| `/me` | 200 |
| `/network` | 200 |
| `/for-you` | 200 |
| `/more` | 200 |

Each of these should have turned a stranger away and did not.

## Links that lead nowhere

None. Every internal link on the public site answered.

## Every page, in full

| Page | Address | Status | Bytes | Missing |
| --- | --- | --- | --- | --- |
| Home | `/` | 200 | 59806 |  |
| Discover | `/discover` | 200 | 49919 |  |
| How it works | `/how-it-works` | 200 | 48534 |  |
| Membership | `/membership` | 307 | 15 |  |
| Villages | `/villages` | 307 | 15 |  |
| A Village page | `/villages/dubai` | 307 | 15 |  |
| Suggest a city | `/villages/suggest` | 307 | 15 |  |
| Events | `/events` | 307 | 15 |  |
| Businesses | `/businesses` | 307 | 15 |  |
| Learning | `/learning` | 307 | 15 |  |
| Media | `/media` | 200 | 38597 |  |
| Watch and Listen | `/watch` | 200 | 36524 |  |
| Members | `/members` | 307 | 15 |  |
| Contact | `/contact` | 200 | 39704 |  |
| Request an invitation | `/apply` | 200 | 42646 | First name; Last name |
| Invitation status | `/apply/status` | 200 | 38464 |  |
| Log in | `/login` | 200 | 36396 |  |
| Privacy | `/legal/privacy` | 200 | 41056 |  |
| Terms | `/legal/terms` | 200 | 41029 |  |
| Cookies | `/legal/cookies` | 200 | 38532 |  |
| Menu | `/menu` | 200 | 41988 |  |
| The 404 | `/this-page-does-not-exist` | 404 | 39922 |  |
