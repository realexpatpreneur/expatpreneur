-- A report belongs to the Village of the person reported

-- 0073 added reports.village_id, backfilled the rows that existed, and
-- rescoped reports_read and reports_update to is_local_admin(village_id).
-- It never set the column on insert, and nothing else does either, so
-- every report filed since 0073 ran carries a null Village. 0073 also
-- made is_local_admin(null) false, which was the whole point of it, so
-- those reports are readable by the reporter and the Global team and by
-- nobody else. A Local Admin opening /admin/reports is told "Nothing
-- open." while an open report about one of their own members sits there.
-- The report page promises "Your Local Admins and the Global team can see
-- it. They will come back to you." Half of that has been false all day.

-- The column cannot simply be filled in by the app and trusted.
-- reports_insert asks only that the reporter is the caller, so a member
-- could file a report into any Village they liked, which both hides it
-- from the admins who should act on it and shows it to admins who should
-- never have seen it. So the database decides and overwrites whatever
-- arrives, which also means every insert path gets it right for free.

-- Null keeps the meaning 0073 gave it: nobody local owns this and it is
-- the Global team's. A report with no subject, or about somebody who has
-- no Village yet, is exactly that case.

create or replace function reports_belong_to_a_village()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.village_id := (
    select p.village_id from profiles p where p.id = new.subject_id
  );
  return new;
end;
$$;

-- Insert only. Nothing in the product changes subject_id after the fact,
-- and an admin moving a report out of their own reach mid-handling would
-- be a worse surprise than the one being fixed here.
drop trigger if exists reports_village_on_insert on reports;
create trigger reports_village_on_insert
  before insert on reports
  for each row execute function reports_belong_to_a_village();

-- The reports filed between 0073 and now, by the same rule 0073 used.
update reports r
   set village_id = p.village_id
  from profiles p
 where p.id = r.subject_id
   and r.village_id is null;
