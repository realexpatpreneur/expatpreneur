# Walking through it before anyone else does

A path through the platform, in the order a real member meets it. Follow it
once yourself, then hand it to Kristiane and watch her do it without
helping. The second part is where the value is: the things she hesitates on
are the things to fix, and you cannot see them from inside the code.

Give it an hour. You need two browsers, or one browser and a private
window, so you can be an admin and a member at the same time.

---

## Before you start

- You are signed in as a Global admin in the first browser.
- The second browser is private, signed in as nobody.
- Email is not connected yet, so nothing arrives in an inbox. Where this
  walkthrough says somebody is emailed, check that the platform says it
  sent rather than waiting for the message.

---

## 1. What a stranger sees

In the private window, go to the site.

- [ ] The home page loads and says what this is.
- [ ] Discover shows Villages, Circles, people, Groups and whatever is
      published. Every tab has something in it, or says plainly that it has
      nothing yet.
- [ ] Search on Discover finds a Village by city name.
- [ ] Members shows only the people who chose to be public.
- [ ] Open one of them. You see their headline and business. You do not see
      what they are looking for, and there is no way to contact them.
- [ ] Membership says what membership is and what the paid plan adds, and
      the prices match what is set at /global/plans.
- [ ] Learning shows courses anybody can buy, with the public price.
- [ ] Media shows anything published that is not members only.
- [ ] The Terms and Privacy pages open, and both say they are drafts.

If any of those pages is empty, that is the real finding. An empty Discover
is worse than no Discover, and it is a content problem rather than a code
one.

## 2. Asking to join

Still in the private window.

- [ ] Request an invitation. Fill it in as a real person would, badly:
      skip the optional parts.
- [ ] It accepts you and says somebody reads every one.
- [ ] Send the same form again. It should refuse, once per address per day.
- [ ] Note the reference you were given. Open /apply/status and check it
      with the email address. It should say where the request stands.
- [ ] Try the same reference with a different email address, and a made up
      reference with the right address. Both should tell you nothing.

In the admin browser:

- [ ] The request is in Requests, with everything the person wrote.
- [ ] The nationality balance panel shows what this person would do to the
      mix of the Village.
- [ ] Approve it. The account is created and the sign in link is sent.

## 3. Being a new member

Open the sign in link in the private window.

- [ ] The welcome flow runs. Do it as a real person: leave some of it
      blank.
- [ ] The member home page loads, and tells you what to do next rather
      than showing you an empty feed.
- [ ] Your Village page shows the Circles, whatever is on, and who runs it.
- [ ] The Directory shows your own Village.
- [ ] For you either suggests people, or says your profile is too empty to
      work from. Both are correct answers.
- [ ] Settings: the five tabs. Change your name on Profile, set a phone
      and a time zone on Account, turn off the weekly digest on
      Notifications, and switch off the public profile on Privacy. All
      four save, and switching the public profile off takes you off
      /members.
- [ ] Settings, Membership: the plan, and Receipts opens even with nothing
      in it.

## 3b. Selling a course

In the admin browser, give yourself the Educator role at /global/roles if
you do not have it, then in the educator workspace:

- [ ] Write a course with two lessons. Set a public price and a lower
      member price. Publish it.
- [ ] At /global/learning it is waiting to be read, not live. Approve it.
- [ ] The educator workspace now shows it as published rather than
      waiting.

In the member browser:

- [ ] The course shows the member price.
- [ ] The lessons do not open before paying.
- [ ] Buy it with a Stripe test card. The lessons open.
- [ ] Ask for a refund from the course page.

In the admin browser:

- [ ] The refund request is on /global/money. Approve it.
- [ ] The member's lessons close again.
- [ ] /educator/sales shows the sale and then the refund.

## 4. An event, end to end

In the admin browser:

- [ ] Create an event for tomorrow. Give it a venue, a full address, and
      set the address to appear 48 hours before.
- [ ] Publish it.

In the member browser:

- [ ] The event appears. Register for it.
- [ ] The full address is shown, because tomorrow is inside 48 hours.
- [ ] Add to calendar downloads a file that opens in a calendar.
- [ ] Cancel your place.

In the admin browser:

- [ ] The registration, and then the cancellation, show on the event.
- [ ] Move the event to a different venue and save. The member is told.
- [ ] Set the event to called off. Everybody registered is told.

Then make a second event with a capacity of one, register somebody, and
register a second member. The second should be offered the waiting list,
and should take the place when the first cancels.

## 5. A live room

In the admin browser:

- [ ] Open a live room for your Village. Enter it.
- [ ] Camera, microphone and screen share work.
- [ ] Start recording. Stop it. Within a minute or two it becomes ready.
- [ ] Watch it back, and publish it into Watch and Listen.

In the member browser:

- [ ] The room is listed. Knock on the door.
- [ ] The host sees you waiting and lets you in.
- [ ] Leave. The attendance count is right, not doubled.

## 6. The things that should be refused

Before doing any of this by hand, run `supabase/tests/access_rules.sql` in
the Supabase SQL editor. It checks thirty seven of these rules in a few seconds,
returns a table and rolls itself back. Failures come first, so if the top
row says ok, all of it passed. Then do the ones
below, which are about the pages rather than the database.

This is the part worth doing slowly, because it is the part that would
embarrass everybody if it were wrong.

In the member browser, as a free member:

- [ ] The Directory of another Village is not open to you.
- [ ] Replying to a Market Exploration post from another Village is not
      open to you.
- [ ] You cannot open the Local Admin workspace by typing /admin.
- [ ] You cannot open the Global workspace by typing /global.
- [ ] You cannot open another member's private profile fields by typing
      their id into /members/.

In the private window, signed in as nobody:

- [ ] /home sends you to the login page.
- [ ] /directory sends you to the login page.
- [ ] A members-only article is not readable.

## 6b. The marketplace and the public site

In the private window, signed in as nobody:

- [ ] /businesses shows listings, and a business page shows its offer and
      services. Send an enquiry. It arrives as a notification and an email
      to the member who owns it.
- [ ] /watch/show/expatpreneurs shows the podcast with its episodes.
- [ ] Sharing an episode gives you an expatpreneur link, not a YouTube
      one.
- [ ] Sign up to the newsletter on /media. It confirms without saying
      whether the address was already on the list.

In the admin browser:

- [ ] /global/businesses takes a listing down. It disappears from the
      public marketplace and the owner is told why.
- [ ] /global/content: open Home, change the hero heading, save as draft.
      The public home page is unchanged. Publish. It changes. Take it back
      to draft. It changes back.
- [ ] /global/emails: reword the application acknowledgement, send
      yourself a test, then send a real request from the private window
      and check the new wording arrives.
- [ ] /global/recognition: set amounts, run the month, mark one paid.
      Running it twice adds nobody twice.
- [ ] /admin/partners: propose a partnered event. Approve it at
      /global/partners with conditions. The proposer is told.

## 7. The admin work

Start at /admin, which is now the workspace's front door.

- [ ] The four figures across the top each open the page that handles
      them, and the To do list shows the WhatsApp tasks, the requests, the
      quiet members and any open report.
- [ ] /admin/mix shows the nationality shares and the largest nationality
      inside each Circle. Nothing about this rule appears anywhere a
      member can see.
- [ ] /admin/reports handles one privately, and sending one up notifies
      the Global team.
- [ ] /admin/leadership puts somebody forward. They are not told.
- [ ] /global/photos records a photograph with a permission and a review
      date. Set a member to left on their member page, and their
      photograph is marked to come down.
- [ ] /educator/learners shows who bought a course, with no email
      addresses. /educator/profile writes what a learner reads, and it
      appears on the course page.

In the admin browser:

- [ ] Send an announcement to the Village. The member sees it.
- [ ] Open the WhatsApp list. The tasks from approving a member are on it.
- [ ] Member care shows who has gone quiet.
- [ ] Insight shows the Village's numbers, and says plainly when there is
      not enough to say anything.
- [ ] The audit log at /global/audit has your approval, your announcement
      and the event you called off in it, in plain words.
- [ ] Village settings: write a welcome message. It appears on the
      member's Village page.
- [ ] Write to the Global team from the same page. It lands in Global
      suggestions.
- [ ] A member proposes a Pod at /pods/propose. Approve it at
      /global/requests. The Pod exists with them leading it.
- [ ] A member asks to move Village at /settings/transfer. Arrange it at
      /admin/transfers. Their Village changes and their Circle clears.

---

## What to write down

For each thing that is wrong, write the page, what you did, what happened,
and what you expected. Send that. A list of twelve small specific things is
worth more than one message saying the events section feels off.

And separately, write down every moment Kristiane paused, asked what
something meant, or clicked the wrong thing first. Those are not bugs and
she will not report them, but they are the difference between a platform
her members use and one they do not.