-- Run once in Supabase Dashboard -> SQL Editor.
-- Adds checkout feedback to existing visitor records without deleting data.

alter table public.visitors
  add column if not exists feedback_rating smallint,
  add column if not exists feedback_review text;

alter table public.visitors
  drop constraint if exists visitors_feedback_rating_check;

alter table public.visitors
  add constraint visitors_feedback_rating_check
  check (feedback_rating is null or feedback_rating between 1 and 5);

comment on column public.visitors.feedback_rating is 'Visitor checkout rating from 1 to 5 stars';
comment on column public.visitors.feedback_review is 'Optional visitor checkout review, maximum 1000 characters enforced by the API';
