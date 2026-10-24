# 140-the-footer-menus-too.ps1
# The footer now reads its menus, like the header. One migration:
# 0053_footer_menus.sql.
#
# I checked both. The header was already reading its menu from 0052.
# The footer was not: five columns and the small print at the bottom
# were all written into the file, so a new page could be linked in the
# header and still be invisible below.
#
# All six read the database now, each falling back to exactly the links
# it shows today if nobody has made that menu. 0053 seeds all six with
# what the footer currently says, so the Menus screen opens with the
# real thing and saving one changes nothing until you edit it.
#
# One thing deliberately left alone: the Villages column still lists
# the Villages from the database, above whatever the menu holds. A new
# Village appears in the footer the day it is created, which is worth
# more than being able to reorder those two lines.
#
# After this, making a page findable is: Pages, make it, publish it,
# then Menus, add a link, choose the page, save. No code anywhere.
#
# Full paths for this script:
#   C:\Users\HP\Desktop\expatpreneur\components\site-footer.tsx
#   C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0053_footer_menus.sql
#
#   powershell -ExecutionPolicy Bypass -File .\140-the-footer-menus-too.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\HP\Desktop\expatpreneur"
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-File($relativePath, $contents) {
    $full = Join-Path $root $relativePath
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $contents, $utf8NoBom)
    Write-Host "wrote $full"
}

$f0 = @'
import Link from "next/link";
import { menu, type MenuItem } from "@/lib/menus";
import { createClient } from "@/lib/supabase/server";
import { Ic } from "@/components/icon";
import { LogoPlain } from "@/components/brand";
import { SubscribeForm } from "@/app/media/subscribe-form";

// pubFoot, as the prototype writes it: brand and newsletter across the
// top, five columns of links, then the small print.
function Col({ title, items }: { title: string; items: React.ReactNode[] }) {
  return (
    <div>
      <h4>{title}</h4>
      <nav>{items}</nav>
    </div>
  );
}

const SOCIAL: [string, string, string][] = [
  ["youtube", "YouTube", "https://www.youtube.com/"],
  ["instagram", "Instagram", "https://www.instagram.com/"],
  ["linkedin", "LinkedIn", "https://www.linkedin.com/"],
  ["mic", "Podcast", "https://open.spotify.com/"],
];

export async function SiteFooter() {
  // Each column shows the menu the Global team keeps, or the links
  // written below if they have not made one.
  const saved: Record<string, MenuItem[]> = Object.fromEntries(
    await Promise.all(
      [
        "footer_explore",
        "footer_villages",
        "footer_marketplace",
        "footer_stories",
        "footer_company",
        "legal",
      ].map(async (name) => [name, await menu(name)] as const)
    )
  );

  const links = (name: string, fallback: [string, string][]) =>
    (saved[name]?.length
      ? saved[name].map((i) => [i.href, i.label] as [string, string])
      : fallback
    ).map(([href, label]) => (
      <Link key={`${href}${label}`} href={href}>
        {label}
      </Link>
    ));

  // The Villages come from the database, so a new one appears here the
  // day it is created rather than the day somebody remembers to edit
  // this file.
  const supabase = await createClient();
  const { data: villages } = await supabase
    .from("villages")
    .select("slug, name, status")
    .in("status", ["open", "launching", "exploring"])
    .order("name");

  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const listed = [...(villages ?? [])].sort(
    (a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
  );

  return (
    <footer className="pubfoot">
      <div className="ft-top">
        <div className="ft-brand">
          <LogoPlain alt smallStyle={{ color: "#A8DCD1" }} />
          <p>
            A curated network of expat entrepreneurs. Local enough to belong,
            global enough to grow, and human enough to matter.
          </p>
          <div className="social">
            {SOCIAL.map(([icon, name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener"
                aria-label={`ExpatPreneurs on ${name}`}
              >
                <Ic name={icon} />
              </a>
            ))}
          </div>
        </div>

        <div className="ft-news">
          <b>The monthly newsletter</b>
          <p>New stories, videos, podcast episodes and events from every Village.</p>
          <SubscribeForm source="footer" />
        </div>
      </div>

      <div className="ft-cols">
        <Col
          title="Explore"
          items={links("footer_explore", [
            ["/how-it-works", "How it works"],
            ["/membership", "Membership"],
            ["/members", "Members"],
            ["/events", "Events"],
            ["/apply", "Request your invitation"],
            ["/apply/status", "Your invitation request"],
          ])}
        />
        <Col
          title="Villages"
          items={[
            ...listed.map((village) => (
              <Link key={village.slug} href={`/villages/${village.slug}`}>
                <span className={`vdot${village.status === "open" ? "" : " soon"}`} />
                {village.name}
                {village.status === "open" ? null : (
                  <small>
                    {village.status === "launching" ? "Launching soon" : "Being explored"}
                  </small>
                )}
              </Link>
            )),
            ...links("footer_villages", [
              ["/villages", "All Villages"],
              ["/villages/suggest", "Suggest a city"],
            ]),
          ]}
        />
        <Col
          title="Marketplace"
          items={links("footer_marketplace", [
            ["/businesses", "Businesses"],
            ["/learning", "Learning"],
            ["/membership", "Teach in the network"],
          ])}
        />
        <Col
          title="Stories"
          items={links("footer_stories", [
            ["/media", "Media"],
            ["/watch", "Videos"],
            ["/watch?kind=podcast", "Podcasts"],
            ["/media", "Founder story"],
          ])}
        />
        <Col
          title="Company"
          items={links("footer_company", [
            ["/contact", "Contact"],
            ["/contact", "Partnerships"],
            ["/contact", "Press"],
            ["/login", "Log in"],
          ])}
        />
      </div>

      <div className="ft-bottom">
        <span>&copy; {new Date().getFullYear()} ExpatPreneurs Global. All rights reserved.</span>
        <nav>
          {links("legal", [
            ["/legal/privacy", "Privacy"],
            ["/legal/terms", "Terms"],
            ["/legal/cookies", "Cookies"],
          ])}
        </nav>
      </div>
    </footer>
  );
}
'@
Write-File "components\site-footer.tsx" $f0

$f1 = @'
-- The footer menus, as the footer reads today.
--
-- The header was seeded in 0052. These are the six that were left, so
-- the Menus screen opens with the real footer rather than empty boxes,
-- and so nothing changes on the site the moment somebody saves one.
--
-- The Villages column is not seeded past its last two links, because
-- the Villages themselves come from the database and should keep doing
-- so. Adding a Village adds it to the footer with no edit here.

insert into menu_items (menu, label, href, position)
select * from (values
  ('footer_explore', 'How it works', '/how-it-works', 1),
  ('footer_explore', 'Membership', '/membership', 2),
  ('footer_explore', 'Members', '/members', 3),
  ('footer_explore', 'Events', '/events', 4),
  ('footer_explore', 'Request your invitation', '/apply', 5),
  ('footer_explore', 'Your invitation request', '/apply/status', 6)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'footer_explore');

insert into menu_items (menu, label, href, position)
select * from (values
  ('footer_villages', 'All Villages', '/villages', 1),
  ('footer_villages', 'Suggest a city', '/villages/suggest', 2)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'footer_villages');

insert into menu_items (menu, label, href, position)
select * from (values
  ('footer_marketplace', 'Businesses', '/businesses', 1),
  ('footer_marketplace', 'Learning', '/learning', 2),
  ('footer_marketplace', 'Teach in the network', '/membership', 3)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'footer_marketplace');

insert into menu_items (menu, label, href, position)
select * from (values
  ('footer_stories', 'Media', '/media', 1),
  ('footer_stories', 'Videos', '/watch', 2),
  ('footer_stories', 'Podcasts', '/watch', 3),
  ('footer_stories', 'Founder story', '/media', 4)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'footer_stories');

insert into menu_items (menu, label, href, position)
select * from (values
  ('footer_company', 'Contact', '/contact', 1),
  ('footer_company', 'Partnerships', '/contact', 2),
  ('footer_company', 'Press', '/contact', 3),
  ('footer_company', 'Log in', '/login', 4)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'footer_company');

insert into menu_items (menu, label, href, position)
select * from (values
  ('legal', 'Privacy', '/legal/privacy', 1),
  ('legal', 'Terms', '/legal/terms', 2),
  ('legal', 'Cookies', '/legal/cookies', 3)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'legal');
'@
Write-File "supabase\migrations\0053_footer_menus.sql" $f1

git add components supabase
git commit -m "The footer reads its menus too, with the coded links as the fallback"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Then run these two in Supabase, in order:"
    Write-Host "  C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0052_menus.sql"
    Write-Host "  C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0053_footer_menus.sql"
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
