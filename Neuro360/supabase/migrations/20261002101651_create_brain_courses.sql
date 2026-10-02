create table public.brain_courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null check (char_length(trim(title)) > 0),
  author text not null default 'Dr Sweta Adatia',
  category text not null default 'general',
  thumbnail_url text,
  course_url text not null check (course_url ~ '^https://'),
  original_price numeric(12, 2) check (original_price is null or original_price >= 0),
  sale_price numeric(12, 2) check (sale_price is null or sale_price > 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  is_free boolean not null default false,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_free and sale_price is null) or (not is_free and sale_price is not null))
);

create table public.brain_course_purchases (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.brain_courses(id),
  patient_id uuid not null references auth.users(id),
  patient_email text not null,
  stripe_session_id text not null unique,
  stripe_payment_intent text,
  amount_paid numeric(12, 2) not null check (amount_paid >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  purchased_at timestamptz not null default now(),
  unique (course_id, patient_id)
);

create index brain_courses_visible_order_idx on public.brain_courses (sort_order) where is_visible;
create index brain_course_purchases_patient_idx on public.brain_course_purchases (patient_id);

alter table public.brain_courses enable row level security;
alter table public.brain_course_purchases enable row level security;

grant select on public.brain_courses to authenticated;
grant select on public.brain_course_purchases to authenticated;

create policy "Patients can read visible brain courses"
  on public.brain_courses for select to authenticated using (is_visible);

create policy "Patients can read their brain course purchases"
  on public.brain_course_purchases for select to authenticated
  using ((select auth.uid()) = patient_id);

insert into public.brain_courses
  (slug, title, author, category, thumbnail_url, course_url, original_price, sale_price, currency, sort_order)
values
  ('neuro-manifestation', 'Neuro Manifestation - Get Your Dream Life Designed', 'Dr Sweta Adatia', 'manifestation', '/brain-course/Neuro Color.jpg', 'https://www.limitlessbrainacademy.com', 7999, 4099, 'INR', 1),
  ('neuro-gut-axis', 'NEURO GUT AXIS FOR A SHARP BRAIN AND LONG LIFE', 'Dr Sweta Adatia', 'health', null, 'https://www.limitlessbrainacademy.com', 4099, 2999, 'INR', 2),
  ('neuro-memory', 'Neuro Memory - Masterclass', 'Dr Sweta Adatia', 'memory', '/brain-course/Neuro Memory.jpg', 'https://www.limitlessbrainacademy.com', 5999, 2999, 'INR', 3),
  ('swara-yoga', 'Swara Yoga For Daily Life', 'Dr Sweta Adatia', 'yoga', '/brain-course/Swara Yoga For Daily Life.jpg', 'https://www.limitlessbrainacademy.com', 5999, 2999, 'INR', 4),
  ('neuro-meditation', 'Neuro Meditation - Brain Rewiring Through Meditation', 'Dr Sweta Adatia', 'meditation', '/brain-course/Neuro Meditation - Brain Rewiring Through Meditation.jpg', 'https://www.limitlessbrainacademy.com', 7999, 4999, 'INR', 5),
  ('neuro-gratitude', 'Neuro Gratitude - Power Manifestation Tool With Healer Codes', 'Limitless Brain Mastery', 'manifestation', '/brain-course/Neuro Gratitude - Power Manifestation Tool With Healer.jpg', 'https://www.limitlessbrainacademy.com', 5999, 3999, 'INR', 6),
  ('neuro-sales', 'Neuro Sales - The Art & Science of Selling', 'Limitless Brain Mastery', 'sales', null, 'https://www.limitlessbrainacademy.com', 15999, 8999, 'INR', 7),
  ('neuro-parenting-hindi', 'Neuro Parenting In Hindi', 'Dr Sweta Adatia', 'parenting', '/brain-course/Neuro Parenting In Hindi.jpg', 'https://www.limitlessbrainacademy.com', 4999, 2999, 'INR', 8),
  ('solfeggio-bundle', 'Bundled 5 Solfeggio Music Frequencies', 'Dr Sweta Adatia', 'frequencies', null, 'https://www.limitlessbrainacademy.com', 9999, 6999, 'INR', 9),
  ('meditation-bundle', 'Bundled 5 Meditation Music Frequencies', 'Dr Sweta Adatia', 'frequencies', null, 'https://www.limitlessbrainacademy.com', 9999, 6999, 'INR', 10),
  ('binaural-bundle', 'Bundled 5 Binaural Beats', 'Dr Sweta Adatia', 'frequencies', null, 'https://www.limitlessbrainacademy.com', 9999, 6999, 'INR', 11),
  ('neuro-breathing', 'Neuro Breathing - The Principles of Yogic Breathing', 'Limitless Brain Mastery', 'breathing', '/brain-course/Neuro Breathing - The Principles of Yogic Breathing.jpg', 'https://www.limitlessbrainacademy.com', 5999, 2999, 'INR', 12)
on conflict (slug) do nothing;
